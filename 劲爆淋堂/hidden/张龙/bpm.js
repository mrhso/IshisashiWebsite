(function(global) {

    "use strict";

    if(global.Pulse) {
        global.console.error("Pulse is already defined");
        return;
    }

    var self;

    /**
     * @global
     * @class Pulse
     * @classdesc Beats per minute (BPM) automatic detection with Web Audio API.
     * @param {object} options Options available for Pulse.
     * @param {function} options.onComplete Fired when Pulse has finished to compute main data: beat, significant peaks.
     * @param {function} options.onRequestProgress Fired when the XHR object is downloading data.
     * @param {function} options.onRequestSuccess Fired when the XHR object has successfully finished.
     * @param {function} options.onRequestAbort Fired when the XHR object has aborted.
     * @param {function} options.onRequestError Fired when the XHR object has an error occured.
     * @param {boolean} [options.convertToMilliseconds=true] If false, significant peaks are in Hertz unit.
     * @param {boolean} [options.removeDuplicates=true] If false, all significant peaks are computed.
     * @returns {void}
     */
    var Pulse = function(options) {

        self = this;

        this.ProcessBuffer = this._ProcessBuffer;

        /**
         * @name Pulse#buffer
         * @description The buffer that contains audio data.
         * @type {object}
         * @default null
         */
        this.buffer = null;

        /**
         * @name Pulse#renderedBuffer
         * @description The rendered buffer in the offline audio context.
         * @type {object}
         * @default null
         */
        this.renderedBuffer = null;

        /**
         * @name Pulse#significantPeaks
         * @description The array of significant peaks found
         * @type {object}
         * @default null
         */
        this.significantPeaks = null;

        /**
         * @name Pulse#beat
         * @description The computed beat including milliseconds and beat per minute.
         * @type {object}
         * @default {ms: null, bpm: null};
         */
        this.beat = {
            ms: null,
            bpm: null
        };

        /**
         * @name Pulse#REQUEST_PROGRESS
         * @description State when a request is in progress.
         * @type {number}
         * @readonly
         */
        Object.defineProperty(this, "REQUEST_PROGRESS", {
            value: 101,
            writable: false
        });

        /**
         * @name Pulse#REQUEST_LOAD
         * @description State when a request is downloading.
         * @type {number}
         * @readonly
         */
        Object.defineProperty(this, "REQUEST_LOAD", {
            value: 102,
            writable: false
        });

        /**
         * @name Pulse#REQUEST_ERROR
         * @description State when a request has an error.
         * @type {number}
         * @readonly
         */
        Object.defineProperty(this, "REQUEST_ERROR", {
            value: 1102,
            writable: false
        });

        /**
         * @name Pulse#REQUEST_ABORT
         * @description State when a request is aborted.
         * @type {number}
         * @readonly
         */
        Object.defineProperty(this, "REQUEST_ABORT", {
            value: 104,
            writable: false
        });

        /**
         * @name Pulse#WEB_AUDIO_API_NOT_SUPPORTED
         * @description State when the browser does not support Web Audio API.
         * @type {number}
         * @readonly
         */
        Object.defineProperty(this, "WEB_AUDIO_API_NOT_SUPPORTED", {
            value: 1001,
            writable: false
        });

        // init state
        var state;

        var changeIndex;

        /**
         * @name Pulse#state
         * @description The state of a Pulse operation.
         * @type {number}
         */
        Object.defineProperty(this, "state", {
            get: function() {
                return parseInt(state, 10);
            },
            set: function(s) {
                if (s == state) {
                    return;
                }

                this.notify({
                    type: "update",
                    name: "state",
                    oldValue: s
                });

                state = s;
            }
        });

        /**
         * @name Pulse#options
         * @description Options available for Pulse.
         * @type {object}
         * @default {}
         */
        Object.defineProperty(this, "options", {
            get: function() {
                return options || this.getDefaultOptions();
            },
            set: function(o) {
                var defaultOptions = this.getDefaultOptions(),
                i;
                for(i in defaultOptions) {
                    if(o[i] === undefined) {
                        o[i] = defaultOptions[i];
                    }
                }

                options = o;
            }
        });

        // init options
        this.options = options;
    };

    /**
     * @method Pulse#getDefaultOptions
     * @description Get the default options.
     * @returns {object} Options with default values
     */
     Pulse.prototype.getDefaultOptions = function() {
        return {
            convertToMilliseconds: true,
            removeDuplicates: true,
        };
    };

    /**
     * @method Pulse#_getOfflineContext
     * @access private
     * @description Get the offline audio context and set nodes and filters.
     * @return {OfflineAudioContext}
     */
    Pulse.prototype._getOfflineContext = function(buffer) {
        var offlineContext = new global.OfflineAudioContext(1, buffer.length, buffer.sampleRate),
        source = offlineContext.createBufferSource(),
        filter = offlineContext.createBiquadFilter();

        source.buffer = buffer;
        filter.type = "lowpass";

        source.connect(filter);
        filter.connect(offlineContext.destination);

        source.start(0);
        return offlineContext;
    };

    var iFrame;
    function createIframe() {
      iFrame = document.createElement('iframe');
      iFrame.style.display = 'none';
      iFrame.onload = () => {
        const script = document.createElement('script');
        script.innerHTML =
          `
            function reload() {
              location.reload();
            }

            function createOfflineContext(NUMBER_OF_CHANNEL, duration, sampleRate) {
              return new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(NUMBER_OF_CHANNEL,duration,sampleRate);
            }
          `;
        iFrame.contentDocument.body.appendChild(script);
      };
      document.body.appendChild(iFrame);
    }

    function getIFrameOfflineContext(NUMBER_OF_CHANNEL, duration, sampleRate) {
      return iFrame.contentWindow.createOfflineContext(NUMBER_OF_CHANNEL, duration, sampleRate);
    }

    function IFrameReload() {
      iFrame.contentWindow.reload();
    }

    /**
     * @method Pulse#_processCallback
     * @access private
     * @description Callback after audio data is decoded.
     * @return {void}
     */
    Pulse.prototype._ProcessBuffer = function(buffer,nextFunction) {
        //createIframe(); //Dont Rape My Memory PLZZZZZ
        var offlineCtx = self._getOfflineContext(buffer);
        //var offlineCtx = getIFrameOfflineContext(1, buffer.length, buffer.sampleRate);
        var source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        //let filter = offlineCtx.createBiquadFilter();

        //filter.type = "lowpass";

        source.connect(offlineCtx.destination);
        //filter.connect(offlineCtx.destination);

        source.start(0);

        offlineCtx.oncomplete = function(event) {
            //setTimeout(function() {
            //  IFrameReload();
            //});
            self.renderedBuffer = event.renderedBuffer;
            //self.significantPeaks = self.getSignificantPeaks(event);
            //self.beat = self.getBeat(self.significantPeaks);
            let BPM = self.NewGetBeat() ;
            self.beat.BPM = !isNaN(BPM) ? BPM : 128;
            self.beat.bpm = self.beat.BPM;
            self.beat.ms = 60000 / self.beat.BPM;
            if(isNaN(BPM))
                console.log("Warning: can't detect BPM");
            else
                console.log(`BPM: ${self.beat.BPM} | ${self.beat.ms} ms`);

            //callback
            nextFunction(self);
        }

        offlineCtx.startRendering();
        
    };
    Pulse.prototype.NewGetBeat = function(){
        var peaks,
        initialThresold = 1.5,
        thresold = initialThresold,
        minThresold = 0.4,
        minPeaks = 30,
        waveData = self.renderedBuffer.getChannelData(0);

        do {
            peaks = getPeaksAtThreshold(waveData, thresold);
            thresold -= 0.05;
        } while (peaks.length < minPeaks && thresold >= minThresold);

        var intervals = countIntervalsBetweenNearbyPeaks(peaks);
        var groups = groupNeighborsByTempo(intervals, self.renderedBuffer.sampleRate);

        var top = groups.sort(function(intA, intB) {
          return intB.count - intA.count;
        }).splice(0, 5);
        return Math.round(top[0].tempo);

    }
    function countIntervalsBetweenNearbyPeaks(peaks) {
      var intervalCounts = [];
      peaks.forEach(function(peak, index) {
        for(var i = 0; i < 10; i++) {
          var interval = peaks[index + i] - peak;
          var foundInterval = intervalCounts.some(function(intervalCount) {
            if (intervalCount.interval === interval)
              return intervalCount.count++;
          });
          if (!foundInterval) {
            intervalCounts.push({
              interval: interval,
              count: 1
            });
          }
        }
      });
      return intervalCounts;
    }

    function groupNeighborsByTempo(intervalCounts, sampleRate) {
        var tempoCounts = [];
        intervalCounts.forEach(function(intervalCount, i) {
        if (intervalCount.interval !== 0) {
        // Convert an interval to tempo
        var theoreticalTempo = 60 / (intervalCount.interval / sampleRate);

        // Adjust the tempo to fit within the 90-180 BPM range
        while (theoreticalTempo < 80) theoreticalTempo *= 2;
        while (theoreticalTempo > 200) theoreticalTempo /= 2;

          theoreticalTempo = Math.round(theoreticalTempo);
          var foundTempo = tempoCounts.some(function(tempoCount) {
            if (tempoCount.tempo === theoreticalTempo)
              return tempoCount.count += intervalCount.count;
          });
          if (!foundTempo) {
            tempoCounts.push({
              tempo: theoreticalTempo,
              count: intervalCount.count
            });
          }
        }
      });

        return tempoCounts;
    }

    function getPeaksAtThreshold(data, threshold) {
      var peaksArray = [];
      var length = data.length;
      for (var i = 0; i < length;) {
        if (data[i] > threshold) {
          peaksArray.push(i);
          // Skip forward ~ 1/4s to get past this peak.
          i += 10000;
        }
            i++;
      }
      return peaksArray;
    }

    /**
     * @method Pulse#_getChannelDataMinMax
     * @description Get the min/max of a channel data.
     * @return {object}
     */
    Pulse.prototype._getChannelDataMinMax = function(channelData) {
        var length = channelData.length,
        min = channelData[0],
        max = channelData[0],
        j;

        for(j = 1; j < length; j++) {
            min = Math.min(min, channelData[j]);
            max = Math.max(max, channelData[j]);
        }

        return {
            min: min,
            max: max
        };
    };

    /**
     * @method Pulse#getSignificantPeaks
     * @description Get the significant peaks.
     * @return {object}
     */
    Pulse.prototype.getSignificantPeaks = function() {

        var channelData = this.renderedBuffer.getChannelData(0),
            limit = this._getChannelDataMinMax(channelData),
            intervalMin = 230, // ms, max tempo = 260 bpm
            amplitude = Math.abs(limit.min) + Math.abs(limit.max),
            maxThreshold = limit.min + amplitude * 0.9, // 90% uppest beats
            minThreshold = limit.min + amplitude * 0.3, // 30% uppest beats
            threshold = maxThreshold,
            acuracy = this.renderedBuffer.sampleRate * (intervalMin / 1000),
            significantPeaks = [],
            duration = parseInt(this.renderedBuffer.duration, 10),
            length = channelData.length,
            i,
            j;

        // grab peaks
        while (
            threshold >= minThreshold &&
            significantPeaks.length <= duration
            ) {
            j = 0;
        for(; j < length; j++) {
            if (channelData[j] > threshold) {
                significantPeaks.push(j);

                j += acuracy;
            }
        }
            threshold -= 0.05; // -5% every interation
        }

        significantPeaks.sort(function(a, b) {
            return a - b;
        });

        if(self.options.convertToMilliseconds) {
            for (i in significantPeaks) {
                significantPeaks[i] = Math.floor((significantPeaks[i] / this.renderedBuffer.sampleRate) * 1000);
            }
        }

        if(self.options.removeDuplicates) {
            // remove all duplicates and 0 values
            significantPeaks = significantPeaks.filter(function(item, pos) {
                return (!pos || item  > significantPeaks[pos - 1]) && item > 0;
            });
        }

        return significantPeaks;
    };

    /**
     * @method Pulse#getBeat
     * @description Get the beat in milliseconds and beat per minute.
     * @return {object}
     */
    Pulse.prototype.getBeat = function(significantPeaks) {
        // count interval durations between each peak
        var intervals = {},
        square = 0,
        count = 0,
        max = 0,
        ms = 0,
        msBetween = [],
        k,
        i,
        j,
        avgCountInterval,
        referenceMs,
        sumMargins = [],
        minMarginIndex = 0,
        minMargin,
        tempo,
        tempoMs;

        for (i = 1; i < significantPeaks.length; i++) {
            for (j = 0; j < i; j++) {

                // assuming intervals must be less than 260 bpm (more than ~230 ms)
                if (significantPeaks[i] - significantPeaks[j] >= 230) {
                    if (intervals[significantPeaks[i] - significantPeaks[j]] === undefined) {
                        intervals[significantPeaks[i] - significantPeaks[j]] = 0;
                    }
                    intervals[significantPeaks[i] - significantPeaks[j]]++;
                }
            }
        }

        // quadratic mean to compute the average power
        for (i in intervals) {
            square += Math.pow(intervals[i], 2);
            count++;
        }

        avgCountInterval = Math.sqrt(square / count);

        /**
         * TODO this needs to be improved
         */

        // get max beats between an interval (1000 ms)
        for (i in intervals) {
            if (intervals[i] > avgCountInterval) {
                if (intervals[i] > max) {
                    max = intervals[i];
                    ms = parseInt(i, 10);
                }

                k = Math.floor(i / 500); // segmentation by 500, this needs to be computed
                if (msBetween[k] === undefined) {
                    msBetween.push({ max: 0, ms: parseInt(i, 10) });
                }

                if (msBetween[k] !== undefined && intervals[i] > msBetween[k].max) {
                    msBetween[k] = { max: intervals[i], ms: parseInt(i, 10) };
                }
            }
        }

        /**
         * TODO this needs to be improved
         */

        // compare ms with all other time beats
        referenceMs = msBetween.slice(0, 3);
        for (i = 0; i < referenceMs.length; i++) {
            sumMargins.push(0);
            for (j in msBetween) {
                sumMargins[i] += msBetween[j].ms % referenceMs[i].ms;
            }
        }

        /**
         * TODO this needs to be improved
         */

        minMarginIndex = 0;
        minMargin = sumMargins[minMarginIndex];
        for (i = 1; i < sumMargins.length; i++) {
            if (minMargin > sumMargins[i]) {
                minMargin = sumMargins[i];
                minMarginIndex = i;
            }
        }

        // find the start beat of tempo
        tempo = Math.round(60000 / referenceMs[minMarginIndex].ms);
        tempoMs = referenceMs[minMarginIndex].ms;

        return {
            ms: tempoMs,
            bpm: tempo
        };
    };

    // bind to global
    global.Pulse = Pulse;

}(window));