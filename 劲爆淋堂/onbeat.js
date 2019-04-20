Onbeat = {
	historyBuffer : [],
	instantEnergy : 0,
	prevTime : 0,
	bpmTable : [],
	sens : 1.05,
	MAX_COLLECT_SIZE : 43 * (256 / 2),
	COLLECT_SIZE : 1,
	bpm : {time: 0, counter: 0},
	bpmArray : new Uint8Array(3),
}

function IsOnBeat(analyser,context,Scale,Music) 
		{
			//var localAverageEnergy = 0;
			//var instantCounter = 0;
			//var isBeat = false; 

	  		analyser.getByteFrequencyData(Onbeat.bpmArray); //size = 128 * [0, 256](?)
	  		if(Math.max(...Array.from(Onbeat.bpmArray)) / 255 * 1.0 >= 1.00)
	  			return Music.seek();
	  		return 0.0;

/*
	  		// fill history buffer 
			for(var i = 0; i < Onbeat.bpmArray.length - 1; i++, ++instantCounter)
			{
				Onbeat.historyBuffer.push(Onbeat.bpmArray[i]);  //add sample to historyBuffer

				Onbeat.instantEnergy += Onbeat.bpmArray[i]; 
			}

			//done collecting MAX_COLLECT_SIZE history samples 
			//have COLLECT_SIZE nr of samples as instant energy value

			if(instantCounter > Onbeat.COLLECT_SIZE - 1  && 
				Onbeat.historyBuffer.length > Onbeat.MAX_COLLECT_SIZE - 1)
			{
				Onbeat.instantEnergy = Onbeat.instantEnergy / (Onbeat.COLLECT_SIZE * (256 / 2));

				var average = 0;
				for(var i = 0; i < Onbeat.historyBuffer.length - 1; i++)
				{
					average += Onbeat.historyBuffer[i]; 
				}

				localAverageEnergy = average/Onbeat.historyBuffer.length;

				var timeDiff = context.currentTime - Onbeat.prevTime;

				// timeDiff > 2 is out of normal song bpm range, but if it is a multiple of range [0.3, 1.5] 
				// we probably have missed a beat before but now have a match in the bpm table.
				
				if(timeDiff > 2 && Onbeat.bpmTable.length > 0)
				{
					//console.log("timediff is now greater than 3");

					//check if we have a multiple of range in bpm table

					for(var j = 0; j < Onbeat.bpmTable.length - 1; j++)
					{
						// mutiply by 10 to avoid float rounding errors
						var timeDiffInteger = Math.round( (timeDiff / Onbeat.bpmTable[j]['time']) * 1000 );

						// timeDiffInteger should now be a multiple of a number in range [3, 15] 
						// if we have a match

						if(timeDiffInteger % (Math.round(Onbeat.bpmTable[j]['time']) * 1000) == 0)
						{
							timeDiff = new Number(Onbeat.bpmTable[j]['time']); 
							//console.log("TIMEDIFF MULTIPLE MATCH: " + timeDiff);
						}
					}				
				}
				

				//still?
				if(timeDiff > 3)
				{
					Onbeat.prevTime = timeDiff = 0; 

				}
						
				////////////////////////
				// MAIN BPM HIT CHECK //
				////////////////////////

				// CHECK IF WE HAVE A BEAT BETWEEN 200 AND 40 BPM (every 0.29 to 2s), or else ignore it.
				// Also check if we have _any_ found prev beats

				if( context.currentTime > 0.29 && Onbeat.instantEnergy > localAverageEnergy &&
					( Onbeat.instantEnergy > (Onbeat.sens * localAverageEnergy) )  && 
				  	( ( timeDiff < 2.0  && timeDiff > 0.29 ) || Onbeat.prevTime == 0  ) )
				{

					isBeat = true; 
					Onbeat.prevTime = context.currentTime;

					Onbeat.bpm = 
					{
							time: timeDiff.toFixed(3),
							counter: 1,
					};


					for(var j = 0; j < Onbeat.bpmTable.length; j++)
					{
						//FOUND ANOTHER MATCH FOR ALREADY GUESSED BEAT

						if(Onbeat.bpmTable[j]['time'] == Onbeat.bpm['time'])
						{
							Onbeat.bpmTable[j]['counter']++;
							Onbeat.bpm = 0;

							if(Onbeat.bpmTable[j]['counter'] > 3 && j < 2)
							{		      	
								
							}

							break;
						} 
					}

					if(Onbeat.bpm != 0 || Onbeat.bpmTable.length == 0)
					{
						Onbeat.bpmTable.push(Onbeat.bpm);
					}

					//sort and draw 10 most current bpm-guesses
					Onbeat.bpmTable.sort(function(a, b)
					{
						return b['counter'] - a['counter']; //descending sort
					});			
				} 

				var temp = Onbeat.historyBuffer.slice(0); //get copy of buffer

				Onbeat.historyBuffer = []; //clear buffer

				// make room in array by deleting the last COLLECT_SIZE samples.
				Onbeat.historyBuffer = temp.slice(Onbeat.COLLECT_SIZE * (analyser.fftSize / 2), temp.length);						

				instantCounter = 0;
				Onbeat.instantEnergy = 0; 

				localAverageEnergy = 0;

			}


			debug = ""; 

			for(i = 0; i < 10; i++)
			{
				if(i >= Onbeat.bpmTable.length)
					break;

			}
	  		return isBeat; 
	  		*/
		}