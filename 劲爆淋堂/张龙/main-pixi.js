var app = new PIXI.Application(1060, 760, {forceFXAA: true,antialias:true,backgroundColor: colorHex(255,250,240)});//0x1099bb
PIXI.settings.ROUND_PIXELS = true; PIXI.settings.RESOLUTION = 1;
app.view.innerHTML = "张龙到处背刺，你也不至于用如此旧的浏览器吧？";
app.view.style = "position: fixed;left:0px; top:0px;cursor:default;"
document.body.appendChild(app.view);
if ("onmousewheel" in document) {
    window.document.onmousewheel = function(ev){canvasMouseWheel(ev)};
} else {
    document.addEventListener('DOMMouseScroll', function(ev){canvasMouseWheel(ev)}, false);
}
window.document.onmousemove = function(ev){canvasMouseMove(ev)};
window.document.onmouseup = function(ev){canvasMouseUp(ev)};
window.document.onmouseup = function(ev){canvasMouseUp(ev)};

/*
var uiShadowFilter = new PIXI.filters.DropShadowFilter({
    roatation:0,
    distance: 1,//0.5,
    alpha:0.5,
    blur:0,
    resolution:1 //AntiAlias
});
*/
//Other
const eqRange = 24, eqGraphX = 350, eqGraphY = 457, eqGraphW = 646, eqGraphH = 240, eqGraphMin = 20, eqGraphMax = 20000, eqViewRange = 18, eqViewTop = 350, eqViewH = 240;
const WaveX = 395,WaveY = 710,WaveW = 606,WaveH = 40;
const LevelX = 1006,LevelY = 452,LevelW = 45,LevelH = 250;

var EQChunks = [];
var ChunkStarts = [20,50,100,200,500,1000,2000,5000,10000];
var EQFX=new Array(), EQFreq = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
var arrayBit=[],arrayBitWaveform = [],arrayBitPersonScale = []; //Sweet Memory(@Chrome) <-> Fast FPS
var Settings = {
    AutoSetLimiterRelease : true,
    AutoSetSmooth : true,
    Auto3DHRTF : false,
}
var SideChainCurve = new Float32Array(10),NextSideChainTime = 0,LastSeekTime = 0.0;

var Music;
var AnalyserNode;
var BPMDetector = new Pulse({onComplete: function(event, pulse) {}});
//var BPM = 128;

var Inited = false;
var GDraggID = -1,GScale = 1.6875;
var PrevTime = 0.0,CurrentTime = 0.0,DeltaTime = 0.0,LastFPSTime = 0.0,LastGetWaveTime = 0.0;
var WaveProgressBarCurrentTime = 0.0;
var MusicDuration = 0.0;
var CanPlay = false;
var NextSideChainTime = 0.0,
SideChainDetectedTime = 0.0;

var colorUINormal = colorHex(232,102,160), colorUIHover = colorHex(255,125,183), colorUIDown = colorHex(222,91,150)
, colorUiProgressBarBackGround = colorHex(0,0,0),colorUiProgressBarIndicator = colorHex(220,220,220), colorUIChecked = colorHex(255, 240, 250)
,LevelMeterColor = colorHex(255,255,255);

var uiBottomInteract = new PIXI.Graphics(); uiBottomInteract.interactive = true; uiBottomInteract.hitArea = new PIXI.Rectangle(0, 0, app.view.width, app.view.height); app.stage.addChild(uiBottomInteract);//var uiBottomMask = new PIXI.Graphics(); uiBottomMask.isMask=true;
var uiBottomGraphics = new PIXI.Graphics(); app.stage.addChild(uiBottomGraphics);//uiBottomGraphics.mask=uiBottomMask; 
var EQIndicator = EQMask(eqGraphX,eqGraphY,eqGraphW,eqGraphH);//app.stage.addChild(EQIndicator);
var uiSpectrumMask = new PIXI.Graphics(); uiSpectrumMask.isMask=true;
var uiSpectrumGraphics = new PIXI.Graphics(); uiSpectrumGraphics.mask=uiSpectrumMask; app.stage.addChild(uiSpectrumGraphics); 
var uiSpectrumCurve = new PIXI.Graphics(); app.stage.addChild(uiSpectrumCurve); uiSpectrumCurve.mask=uiSpectrumMask;
var uiGraphics = new PIXI.Graphics(); app.stage.addChild(uiGraphics);
var WaveDisplay = new UiWave(WaveX,WaveY,WaveW,WaveH)
,uiWaveProgressBar = new UiProgressBar(WaveX,WaveY,WaveW,WaveH);

var isInWaveformWindow = true,isSettingWindowOpen = false;

var TestSetting = false,Volume = 50,Smooth = 80,MaxDecibels = 80,MinDecibels = 30, EQ=[], PlaySpeed = 0.0;
var SongBPM = 138,DetectedBPM = 138,SideChainScale = 0;

// === UI Objects ===
function drawUI()
{
    
}

function SetupEQChunk(){
    /*这个算法先注释掉
    let ChunkXs = [350,440,520,605,680,755,850,925,966,997];
    for(i=0; i<9; i++)
    {
        EQChunkParam = {
            Start : ChunkStarts[i],
            End : i >= 8 ? 20000 : ChunkStarts[i+1] - 1,
            X : ChunkXs[i],
            Width : ChunkXs[i+1] - ChunkXs[i] - 1
        }
        EQChunks.push(EQChunkParam);
    }
    */
    let ChunkXs = new Array();
    for (i=0; i< ChunkStarts.length; i++)
    {
        ChunkXs.push(eqGraphX + eqGraphW * ((Math.log2(ChunkStarts[i]) - Math.log2(eqGraphMin)) / (Math.log2(eqGraphMax) - Math.log2(eqGraphMin))));
    }
    ChunkXs.push(eqGraphX+eqGraphW);
    for(i=0; i<ChunkStarts.length; i++)
    {
        EQChunkParam = {
            Start : ChunkStarts[i],
            End : i >= ChunkStarts.length-1 ? eqGraphMax : ChunkStarts[i+1] ,
            X : ChunkXs[i],
            Width : ChunkXs[i+1] - ChunkXs[i] 
        }
        EQChunks.push(EQChunkParam);
    }
    //上边是修改过的算法
}

// === Begin UIControl ===
function UiWave(x, y ,w ,h){
    this.graphics = new PIXI.Graphics();
    //this.graphics.filters = [uiShadowFilter];
    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawRoundedRect(x,y,w,h,6);
    this.graphics.endFill();

    this.graphics.text = new PIXI.Text("Waiting For Audio Load");
    this.graphics.text.x = x + w/2;
    this.graphics.text.y = y + h/2;
    this.graphics.text.anchor.set(0.5);
    this.graphics.text.style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'white',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 25.3
    });
    

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    app.stage.addChild(this.graphics);
    app.stage.addChild(this.graphics.text);

    this.ClearRect = function(){
        this.graphics.text.visible = true;
        this.graphics.clear();
        this.graphics.beginFill(colorUINormal,1);
        this.graphics.drawRoundedRect(x,y,w,h,6);
        this.graphics.endFill();
    }

    this.Refresh = function(ctx){
        if(ctx == undefined || Howler.AudioBuffer == undefined || Howler.AudioBuffer == null)
            return;
        this.graphics.text.visible = true;
        let waveData = Howler.AudioBuffer.getChannelData(0);
        let duration = Music._duration;
        let gap = Math.ceil(waveData.length / WaveW);

        //this.graphics.beginFill(0xFFFFFF,1);
        //this.graphics.drawRect(WaveX,WaveY + Math.round(WaveH / 2) - 1,WaveW,1);
        //this.graphics.endFill();

        
        amp = WaveH / 2;
        let MaxArray = [];
        for(var i=0; i < WaveW-4; i++){
            MaxArray.push(waveData[(i*gap)]);
        }
        let WaveMax = Math.abs(Math.max(...MaxArray) * amp);
        let WaveScale = ((WaveH - WaveMax) / amp);
        if(WaveScale <= 1.45)
            WaveScale = 1.45;
        if(WaveScale >= 1.8)
            WaveScale = 1.8;
        for(var i=0; i < WaveW-4; i++){
            min = 1.0;
            max = -1.0;
            for (var j=0; j<gap; j++) {
                var datum = waveData[(i*gap)+j] / WaveScale; 
                if (datum < min)
                    min = datum;
                if (datum > max)
                    max = datum;
            }
            this.graphics.beginFill(0xFFFFFF,1);
            this.graphics.drawRect(WaveX + 2 + i,WaveY + (1+min)*amp,1,Math.max(1,(max-min)*amp));
            this.graphics.endFill();

            this.graphics.beginFill(0xFFFFFF,0.2);
            this.graphics.drawRect(WaveX + 3 + i,WaveY + (1+min)*amp,1,Math.max(1,(max-min)*amp));
            this.graphics.endFill();
        }
        this.graphics.text.visible = false;
        delete waveData;
    }
    return this;
}

function UiProgressBar(x, y ,w ,h){
    this.graphics = new PIXI.Graphics();
    this.graphics.isDragging = false;
    this.shape = new PIXI.RoundedRectangle(x, y, w, h, 6);
    this.graphics.interactive = true;
    this.graphics.hitArea = this.shape;
    this.graphics.beginFill(colorUiProgressBarBackGround,0.5);
    this.graphics.drawRoundedRect(x,y,0,h,0);
    this.graphics.endFill();

    this.graphics.xPos = x;
    this.graphics.yPos = y;
    this.graphics.Width = w;
    this.graphics.Height = h;

    app.stage.addChild(this.graphics);

    this.ClearRect = function(){
        this.graphics.clear();
        this.graphics.beginFill(colorUiProgressBarBackGround,0.0);
        this.graphics.drawRoundedRect(this.graphics.xPos,this.graphics.yPos,14,this.graphics.Height,6);
        this.graphics.endFill();
    }

    this.Refresh = function(ctx){
        if(this.graphics.isDragging) return;
        this.graphics.clear();
        WaveProgressBarCurrentTime = (Music.seek() / MusicDuration * this.graphics.Width);
        if(WaveProgressBarCurrentTime >= this.graphics.Width)
            WaveProgressBarCurrentTime = this.graphics.Width;

        this.graphics.beginFill(colorUiProgressBarBackGround,0.5);
        if(WaveProgressBarCurrentTime >= 12)
            this.graphics.drawRoundedRect(this.graphics.xPos,this.graphics.yPos,WaveProgressBarCurrentTime,this.graphics.Height,6);
        else {
            let Height = WaveProgressBarCurrentTime / 12.0 * this.graphics.Height;
            if(Height <= 30.0)
                Height = 30.0;
            this.graphics.drawRoundedRect(this.graphics.xPos,this.graphics.yPos + (this.graphics.Height / 2) - (Height / 2),WaveProgressBarCurrentTime,Height,WaveProgressBarCurrentTime / 12.0 * 6.0); //Rounded Bug
        }
        this.graphics.endFill();
    }

    this.stateNormal = function(){
        if(this.isDragging) return;
    }
    this.stateDown = function(event){
        this.isDragging = true;
        let DragLength = ((event.data.getLocalPosition(this.parent).x - this.xPos));
        if(DragLength > this.Width)
            DragLength = this.Width;
        if(DragLength <= 0.0)
            DragLength = 0.0;
        this.clear();
        this.beginFill(colorUiProgressBarBackGround,0.5);
        if(DragLength >= 12)
            this.drawRoundedRect(this.xPos,this.yPos,DragLength,this.Height,6);
        else {
            let Height = DragLength / 12.0 * this.Height;
            if(Height <= 30.0)
                Height = 30.0;
            this.drawRoundedRect(this.xPos,this.yPos + (this.Height / 2) - (Height / 2),DragLength+2,Height,DragLength / 12.0 * 6.0); //Rounded Bug
        }
        this.endFill();
    }
    this.stateHover = function(){
        
    }
    
    this.stateRelease = function(event){
        if (!this.isDragging) return;
        ResetSideChainTime();
        Music.seek(((event.data.getLocalPosition(this.parent).x - this.xPos)) / this.Width * MusicDuration);
        this.isDragging = false;
    }

    this.stateOut = function(event){
        if (!this.isDragging) return;
        let MousePosX = (event.data.getLocalPosition(this.parent).x - this.xPos);
        if(MousePosX <= 0.0)
            MousePosX = 0.0;
        if(MousePosX >= this.Width)
            MousePosX = this.Width;
        Music.seek(MousePosX / this.Width * MusicDuration);
        this.isDragging = false;
    }
    
    this.stateMove = function(event){
        if (!this.isDragging) return;
        let DragLength = ((event.data.getLocalPosition(this.parent).x - this.xPos));
        if(DragLength > this.Width)
            DragLength = this.Width;
        if(DragLength <= 0.0)
            DragLength = 0.0;
        this.clear();
        this.beginFill(colorUiProgressBarBackGround,0.5);
        if(DragLength >= 12)
            this.drawRoundedRect(this.xPos,this.yPos,DragLength,this.Height,6);
        else {
            let Height = DragLength / 12.0 * this.Height;
            if(Height <= 30.0)
                Height = 30.0;
            this.drawRoundedRect(this.xPos,this.yPos + (this.Height / 2) - (Height / 2),DragLength+2,Height,DragLength / 12.0 * 6.0); //Rounded Bug
        }
        this.endFill();
    }

    this.graphics
        .on('pointerdown', this.stateDown)
        .on('pointerup', this.stateRelease)
        .on('pointerupoutside', this.stateOut)
        .on('pointerover', this.stateHover)
        .on('pointerout', this.stateNormal)
        .on('pointermove', this.stateMove);

    return this;
}

function SliderHorizontal(x, y, width, height, radius, text, defaultValue, type)
{
    this.isDragging = false;
    this.value = defaultValue;
    this.graphics = new PIXI.Graphics();
    this.shape = new PIXI.RoundedRectangle(x, y, width, height, radius);
    this.graphics.interactive = true;
    this.graphics.hitArea = this.shape;
    this.text = new PIXI.Text(text);
    this.text.x = x + width/2;
    this.text.y = y + height*1.25;
    this.text.anchor.set(0.5,0);
    this.text.style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'black',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 17
    });
    this.graphicsFill = new PIXI.Graphics();
    this.graphicsTop = new PIXI.Graphics();
    app.stage.addChild(this.graphics);
    app.stage.addChild(this.graphicsFill);
    app.stage.addChild(this.graphicsTop);
    app.stage.addChild(this.text);
    
    this.graphics.lineStyle(2,colorUIDown,1);
    this.graphics.beginFill(colorUINormal,0.1);
    this.graphics.drawRoundedRect(x,y,width,height,radius);
    this.graphics.endFill();
    
    this.graphicsFill.beginFill(colorUIDown,1);
    this.graphicsFill.drawRoundedRect(x,y,width*defaultValue/100,height,radius);
    this.graphicsFill.endFill();
    this.graphicsTop.beginFill(colorUINormal,1);
    this.graphicsTop.drawCircle(x+width*defaultValue/100,y+height/2,height*1.2);
    this.graphicsTop.endFill();
    //Addition
    this.graphics.graphicsFill = this.graphicsFill;
    this.graphics.graphicsTop = this.graphicsTop;
    this.graphics.isDragging = false;
    this.graphics.value = defaultValue;
    this.graphics.defaultValue = defaultValue;
    this.graphics.text = this.text;
    this.graphics.valueType = type;

    this.stateNormal = function(){
        
        if(this.isDragging) return;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    
    }

    this.stateDown = function(event){
        if(event.data.originalEvent.button != 0){
            this.value = this.defaultValue;
        } else {
            this.isDragging = true;
            this.value = Math.round(100 * (event.data.getLocalPosition(this.parent).x - x)/width);
        }
        if(this.valueType == 3)
        {
            if (this.value<0) this.value = 0;
            else if(this.value>=MaxDecibels) this.value = MaxDecibels-1;
        }
        else if (this.valueType == 4)
        {
            if (this.value<=MinDecibels) this.value = MinDecibels+1;
            else if(this.value>100) this.value = 100;
        }
        else
        {
            if (this.value<0) this.value = 0;
            else if(this.value>100) this.value = 100;
        }
        switch(this.valueType){
            case 1:
                Volume = this.value;
                this.text.text = "音量：" + this.value + "%";
                break;
            case 2:
                Smooth = this.value;
                this.text.text = "平滑：" + this.value + "%";
                break;
            case 3:
                MinDecibels = this.value;
                this.text.text = "最小分贝：" + this.value + "%";
                break;
            case 4:
                MaxDecibels = this.value;
                this.text.text = "最大分贝：" + this.value + "%";
                break;
            default:  
                this.text.text = "未知：" + this.value + "%";
                break;
        }
        updateAudioBasic();
        this.graphicsFill.clear();
        this.graphicsFill.beginFill(colorUIDown,1);
        this.graphicsFill.drawRoundedRect(x,y,width*this.value/100,height,radius);
        this.graphicsFill.endFill();
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
        /*
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
        */
    }

    this.stateHover = function(){
        //this.isDragging = true;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIHover,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }
    
    this.stateRelease = function(){
        this.isDragging = false;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIHover,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.stateOut = function(){
        this.isDragging = false;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }
    
    this.stateMove = function(event){
        //console.log(this.isDragging);
        //console.log(this.valueType);
        if (!this.isDragging) return;
        this.value = Math.round(100 * (event.data.getLocalPosition(this.parent).x - x)/width);
        if(this.valueType == 3)
        {
            if (this.value<0) this.value = 0;
            else if(this.value>=MaxDecibels) this.value = MaxDecibels-1;
        }
        else if (this.valueType == 4)
        {
            if (this.value<=MinDecibels) this.value = MinDecibels+1;
            else if(this.value>100) this.value = 100;
        }
        else
        {
            if (this.value<0) this.value = 0;
            else if(this.value>100) this.value = 100;
        }
        switch(this.valueType){
            case 1:
                Volume = this.value;
                this.text.text = "音量：" + this.value + "%";
                break;
            case 2:
                Smooth = this.value;
                this.text.text = "平滑：" + this.value + "%";
                break;
            case 3:
                MinDecibels = this.value;
                this.text.text = "最小分贝：" + this.value + "%";
                break;
            case 4:
                MaxDecibels = this.value;
                this.text.text = "最大分贝：" + this.value + "%";
                break;
            default:  
                this.text.text = "未知：" + this.value + "%";
                break;
        }
        updateAudioBasic();
        this.graphicsFill.clear();
        this.graphicsFill.beginFill(colorUIDown,1);
        this.graphicsFill.drawRoundedRect(x,y,width*this.value/100,height,radius);
        this.graphicsFill.endFill();
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.SetValue = (setvalue,setvalueType) => {
        this.graphics.value = setvalue;
        this.graphics.valueType = setvalueType;
        if(this.graphics.valueType == 3)
        {
            if (this.graphics.value<0) this.value = 0;
            else if(this.graphics.value>=MaxDecibels) this.graphics.value = MaxDecibels-1;
        }
        else if (this.graphics.valueType == 4)
        {
            if (this.graphics.value<=MinDecibels) this.graphics.value = MinDecibels+1;
            else if(this.graphics.value>100) this.graphics.value = 100;
        }
        else
        {
            if (this.graphics.value<0) this.graphics.value = 0;
            else if(this.graphics.value>100) this.graphics.value = 100;
        }
        switch(this.graphics.valueType){
            case 1:
                Volume = this.graphics.value;
                this.text.text = "音量：" + this.graphics.value + "%";
                break;
            case 2:
                Smooth = this.graphics.value;
                this.text.text = "平滑：" + this.graphics.value + "%";
                break;
            case 3:
                MinDecibels = this.graphics.value;
                this.text.text = "最小分贝：" + this.graphics.value + "%";
                break;
            case 4:
                MaxDecibels = this.graphics.value;
                this.text.text = "最大分贝：" + this.graphics.value + "%";
                break;
            default:  
                this.text.text = "未知：" + this.graphics.value + "%";
                break;
        }
        updateAudioBasic();
        this.graphicsFill.clear();
        this.graphicsFill.beginFill(colorUINormal,1);
        this.graphicsFill.drawRoundedRect(x,y,width*this.graphics.value/100,height,radius);
        this.graphicsFill.endFill();
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.graphics.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.graphics
        .on('pointerdown', this.stateDown)
        .on('pointerup', this.stateRelease)
        .on('pointerupoutside', this.stateOut)
        .on('pointerover', this.stateHover)
        .on('pointerout', this.stateNormal)
        .on('pointermove', this.stateMove);
}

function SliderFFT(x, y, width, height, radius, defaultValue)
{
    this.isDragging = false;
    this.value = defaultValue;
    this.graphics = new PIXI.Graphics();
    this.shape = new PIXI.RoundedRectangle(x, y, width, height, radius);
    this.graphics.interactive = true;
    this.graphics.hitArea = this.shape;
    this.text = new PIXI.Text("FFT：8192");
    this.text.x = x + width/2;
    this.text.y = y + height*1.25;
    this.text.anchor.set(0.5,0);
    this.text.style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'black',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 17
    });
    this.graphicsFill = new PIXI.Graphics();
    this.graphicsTop = new PIXI.Graphics();
    app.stage.addChild(this.graphics);
    app.stage.addChild(this.graphicsFill);
    app.stage.addChild(this.graphicsTop);
    app.stage.addChild(this.text);
    
    this.graphics.lineStyle(2,colorUIDown,1);
    this.graphics.beginFill(colorUINormal,0.1);
    this.graphics.drawRoundedRect(x,y,width,height,radius);
    this.graphics.endFill();
    
    this.graphicsFill.beginFill(colorUIDown,1);
    this.graphicsFill.drawRoundedRect(x,y,width*defaultValue/9,height,radius);
    this.graphicsFill.endFill();
    this.graphicsTop.beginFill(colorUINormal,1);
    this.graphicsTop.drawCircle(x+width*defaultValue/9,y+height/2,height*1.2);
    this.graphicsTop.endFill();
    //Addition
    this.graphics.graphicsFill = this.graphicsFill;
    this.graphics.graphicsTop = this.graphicsTop;
    this.graphics.isDragging = false;
    this.graphics.value = defaultValue;
    this.graphics.text = this.text;

    this.stateNormal = function(){
        
        if(this.isDragging) return;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.value/9,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    
    }

    this.stateDown = function(event){
        if(event.data.originalEvent.button != 0){
            this.value = 7;
        } else {
            this.isDragging = true;
            this.value = Math.round(8 * (event.data.getLocalPosition(this.parent).x - x)/width);
        }
        if (this.value<0) this.value = 0;
        else if(this.value>9) this.value = 9;
        if (Inited)
        {
            AnalyserNode.fftSize = Math.round(Math.pow(2,6+this.value));
            this.text.text = "FFT："+AnalyserNode.fftSize;
            AnalyserNode.fftSize <= 8192 ? GScale = 2-(AnalyserNode.fftSize / 32768 * 1.5) : 1.5;
            arrayBit = new Uint8Array(AnalyserNode.frequencyBinCount);

            if(Settings.AutoSetSmooth && AnalyserNode.fftSize > 8192)
                WaveSettingWindow.UiControls["sliderSmooth"].SetValue(0,2);
            else if(Settings.AutoSetSmooth && AnalyserNode.fftSize <= 8192)
                WaveSettingWindow.UiControls["sliderSmooth"].SetValue(80,2);
        }
        this.graphicsFill.clear();
        this.graphicsFill.beginFill(colorUIDown,1);
        this.graphicsFill.drawRoundedRect(x,y,width*this.value/9,height,radius);
        this.graphicsFill.endFill();
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.value/9,y+height/2,height*1.2);
        this.graphicsTop.endFill();
        /*
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.value/8,y+height/2,height*1.2);
        this.graphicsTop.endFill();*/
    }

    this.stateHover = function(){
        //this.isDragging = true;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIHover,1);
        this.graphicsTop.drawCircle(x+width*this.value/9,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }
    
    this.stateRelease = function(){
        this.isDragging = false;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIHover,1);
        this.graphicsTop.drawCircle(x+width*this.value/9,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.stateOut = function(){
        this.isDragging = false;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.value/9,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }
    
    this.stateMove = function(event){
        //console.log(this.isDragging);
        //console.log(this.valueType);
        if (!this.isDragging) return;
        this.value = Math.round(9 * (event.data.getLocalPosition(this.parent).x - x)/width);
        if (this.value<0) this.value = 0;
        else if(this.value>9) this.value = 9;
        if (Inited)
        {
            AnalyserNode.fftSize = Math.round(Math.pow(2,6+this.value));
            this.text.text = `FFT：${AnalyserNode.fftSize}`;
            AnalyserNode.fftSize <= 8192 ? GScale = 2-(AnalyserNode.fftSize / 32768 * 1.5) : 1.5;
            arrayBit = new Uint8Array(AnalyserNode.frequencyBinCount);

            if(Settings.AutoSetSmooth && AnalyserNode.fftSize > 8192)
                WaveSettingWindow.UiControls["sliderSmooth"].SetValue(0,2);
            else if(Settings.AutoSetSmooth && AnalyserNode.fftSize <= 8192)
                WaveSettingWindow.UiControls["sliderSmooth"].SetValue(80,2);
        }
        this.graphicsFill.clear();
        this.graphicsFill.beginFill(colorUIDown,1);
        this.graphicsFill.drawRoundedRect(x,y,width*this.value/9,height,radius);
        this.graphicsFill.endFill();
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.value/9,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.graphics
        .on('pointerdown', this.stateDown)
        .on('pointerup', this.stateRelease)
        .on('pointerupoutside', this.stateOut)
        .on('pointerover', this.stateHover)
        .on('pointerout', this.stateNormal)
        .on('pointermove', this.stateMove);
}
function SliderSpeed(x, y, width, height, radius, defaultValue)
{
    this.isDragging = false;
    this.value = defaultValue;
    this.graphics = new PIXI.Graphics();
    this.shape = new PIXI.RoundedRectangle(x, y, width, height, radius);
    this.graphics.interactive = true;
    this.graphics.hitArea = this.shape;
    this.text = new PIXI.Text("变调：正常");
    this.text.x = x + width/2;
    this.text.y = y + height*1.25;
    this.text.anchor.set(0.5,0);
    this.text.style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'black',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 17
    });
    this.graphicsFill = new PIXI.Graphics();
    this.graphicsTop = new PIXI.Graphics();
    app.stage.addChild(this.graphics);
    app.stage.addChild(this.graphicsFill);
    app.stage.addChild(this.graphicsTop);
    app.stage.addChild(this.text);
    
    this.graphics.lineStyle(2,colorUIDown,1);
    this.graphics.beginFill(colorUINormal,0.1);
    this.graphics.drawRoundedRect(x,y,width,height,radius);
    this.graphics.endFill();
    
    this.graphicsFill.beginFill(colorUIDown,1);
    this.graphicsFill.drawRect(x+width*this.value/48,y,width / 2 - (width*this.value/48),height);
    this.graphicsFill.endFill();
    this.graphicsTop.beginFill(colorUINormal,1);
    this.graphicsTop.drawCircle(x+width*defaultValue/48,y+height/2,height*1.2);
    this.graphicsTop.endFill();
    //Addition
    this.graphics.graphicsFill = this.graphicsFill;
    this.graphics.graphicsTop = this.graphicsTop;
    this.graphics.isDragging = false;
    this.graphics.value = defaultValue;
    this.graphics.text = this.text;

    this.stateNormal = function(){
        
        if(this.isDragging) return;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.value/48,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    
    }

    this.stateDown = function(event){
        if(event.data.originalEvent.button != 0){
            this.value = 24;
        } else {
            this.isDragging = true;
            this.value = Math.round(48 * (event.data.getLocalPosition(this.parent).x - x)/width);
        }
        if (this.value<0) this.value = 0;
        else if(this.value>48) this.value = 48;
        PlaySpeed = this.value-24;
        updatePitch();
        let v = (this.value-24);
        if(v == 0)
            this.text.text = "变调：正常";
        else
            this.text.text = `变调：${(v > 0 ? "+" : "")+v}00 Cents`;

        this.graphicsFill.clear();
        this.graphicsFill.beginFill(colorUIDown,1);
        this.graphicsFill.drawRect(x+width*this.value/48,y,width / 2 - (width*this.value/48),height);
        this.graphicsFill.endFill();
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.value/48,y+height/2,height*1.2);
        this.graphicsTop.endFill();
        /*
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.value/8,y+height/2,height*1.2);
        this.graphicsTop.endFill();*/
    }

    this.stateHover = function(){
        //this.isDragging = true;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIHover,1);
        this.graphicsTop.drawCircle(x+width*this.value/48,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }
    
    this.stateRelease = function(){
        this.isDragging = false;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIHover,1);
        this.graphicsTop.drawCircle(x+width*this.value/48,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.stateOut = function(){
        this.isDragging = false;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.value/48,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }
    
    this.stateMove = function(event){
        //console.log(this.isDragging);
        //console.log(this.valueType);
        if (!this.isDragging) return;
        this.value = Math.round(48 * (event.data.getLocalPosition(this.parent).x - x)/width);
        if (this.value<0) this.value = 0;
        else if(this.value>48) this.value = 48;
        PlaySpeed = this.value-24;
        updatePitch();
        let v = (this.value-24);
        if(v == 0)
            this.text.text = "变调：正常";
        else
            this.text.text = `变调：${(v > 0 ? "+" : "")+ v}00 Cents`;
        this.graphicsFill.clear();
        this.graphicsFill.beginFill(colorUINormal,1);
        this.graphicsFill.drawRect(x+width*this.value/48,y,width / 2 - (width*this.value/48),height);
        this.graphicsFill.endFill();
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.value/48,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.resetDefault = function(){
        this.isDragging = false;
        this.graphics.value = 24.0;
        PlaySpeed = 0;
        updatePitch();
        this.text.text = "颤↓音↑:正常";
        this.graphicsFill.clear();
        this.graphicsFill.beginFill(colorUIDown,1);
        this.graphicsFill.drawRect(x+width*this.value/48,y,width / 2 - (width*this.value/48),height);
        this.graphicsFill.endFill();
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.value/48,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.graphics
        .on('pointerdown', this.stateDown)
        .on('pointerup', this.stateRelease)
        .on('pointerupoutside', this.stateOut)
        .on('pointerover', this.stateHover)
        .on('pointerout', this.stateNormal)
        .on('pointermove', this.stateMove);
}

function DragCircle(radius, defaultFreq, defaultQ, defaultGain, range, id)
{
    this.graphics = new PIXI.Graphics();
    this.infoBack = new PIXI.Graphics();
    this.graphics.defaultX = eqGraphX + eqGraphW * ((Math.log2(defaultFreq) - Math.log2(eqGraphMin)) / (Math.log2(eqGraphMax) - Math.log2(eqGraphMin)));
    this.graphics.defaultY = eqGraphY + eqGraphH/2 - defaultGain/range * eqGraphH/2;
    this.shape = new PIXI.Circle(0,0,radius);
    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawCircle(0,0, radius);
    this.graphics.endFill();
    this.graphics.hitArea = this.shape;
    this.graphics.interactive = true;
    this.graphics.x = this.graphics.defaultX;
    this.graphics.y = this.graphics.defaultY;
    this.textID = new PIXI.Text(id);
    this.textID.x = this.graphics.defaultX;
    this.textID.y = this.graphics.defaultY;
    this.textID.anchor.set(0.5);
    this.textID.style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'white',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 22
    });
    this.infoBack.x = this.graphics.defaultX;
    this.infoBack.y = this.graphics.defaultY + radius*1.25;
    this.textInfo = new PIXI.Text(id);
    this.textInfo.x = this.graphics.defaultX;
    this.textInfo.y = this.graphics.defaultY+radius*1.25;
    this.textInfo.anchor.set(0.5,0);
    this.textInfo.style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'white',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 18,
        'dropShadow' : true,
        'dropShadowBlur' : 0.4,
        'dropShadowDistance' : 0,
        'dropShadowAlpha' : 0.2
    });
    app.stage.addChild(this.graphics);
    app.stage.addChild(this.infoBack);
    app.stage.addChild(this.textID);
    app.stage.addChild(this.textInfo);
    this.graphics.infoBack = this.infoBack;
    this.graphics.textID = this.textID;
    this.graphics.textInfo = this.textInfo;
    this.graphics.defaultFreq = defaultFreq;
    this.graphics.defaultQ = defaultQ + 0.0;
    this.graphics.defaultGain = defaultGain;
    this.graphics.freq = defaultFreq;
    this.graphics.q = defaultQ + 0.0;
    this.graphics.gain = defaultGain;
    this.graphics.id = id;
    this.graphics.range = range;
    this.graphics.downGrX = 0;
    this.graphics.downGrY = 0;
    this.graphics.downX = 0;
    this.graphics.downY = 0;
    this.graphics.isDragging = false;
    this.graphics.isHovering = false;
    
    this.infoBack.visible = false;
    this.textInfo.visible = false;
    this.textInfo.text = makeEQStr(this.graphics.freq, this.graphics.q, this.graphics.gain);

    this.stateNormal = function(){
        this.isHovering = false;
        if(this.isDragging) return;
        this.clear();
        this.beginFill(colorUINormal,1);
        this.drawCircle(0,0,radius);
        this.endFill();

        this.infoBack.visible = false;
        this.textInfo.visible = false;
        
    }

    this.stateDown = function(event){
        if(event.data.originalEvent.button != 0){
            this.x = this.defaultX;
            this.y = this.defaultY;
            this.freq = this.defaultFreq;
            this.q = this.defaultQ;
            this.gain = this.defaultGain;
            this.infoBack.x = this.defaultX;
            this.infoBack.y = this.defaultY + radius*1.25;
            this.textInfo.x = this.defaultX;
            this.textInfo.y = this.defaultY+radius*1.25;
            this.textID.x = this.defaultX;
            this.textID.y = this.defaultY;
            this.downGrX = 0;
            this.downGrY = 0;
            this.downX = 0;
            this.downY = 0;
            if (Inited)
            {
                EQFX[this.id-1].frequency.value = this.defaultFreq;
                EQFX[this.id-1].gain.value = this.defaultGain;
                EQFX[this.id-1].Q.value = this.defaultQ;
                updateAudioFX();
            }
            this.clear();
            this.beginFill(colorUINormal,0.3);
            this.drawCircle(0,0,radius);
            this.endFill();
            this.infoBack.visible = false;
            this.textWH = PIXI.TextMetrics.measureText(this.textInfo.text, this.textInfo.style);
            this.textInfo.visible = false;
            this.textInfo.text = makeEQStr(this.freq, this.q, this.gain);
            return;
        }
        this.isHovering = true;
        this.isDragging = true;
        GDraggID = id;
        this.downGrX = this.x; this.downGrY = this.y;
        evPos = event.data.getLocalPosition(this.parent);
        //console.log(evPos);
        this.downX = evPos.x; this.downY = evPos.y;
        //if (Inited)
        //{
            
        //}
        this.clear();
        this.beginFill(colorUIDown,0.3);
        this.drawCircle(0,0,radius);
        this.endFill();
        this.infoBack.visible = true;
        this.textInfo.visible = true;
        /*
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.value/8,y+height/2,height*1.2);
        this.graphicsTop.endFill();*/
    }

    this.stateHover = function(){
        //console.log(GDraggID);
        if(GDraggID != -1 && GDraggID != id)
            return;
        this.isHovering = true;
        //console.log("Drag circle "+id + " hovered!");
        //this.isDragging = true;
        this.clear();
        this.beginFill(colorUIHover,1);
        this.drawCircle(0,0,radius);
        this.endFill();

        this.infoBack.beginFill(colorUINormal,1);
        this.textWH = PIXI.TextMetrics.measureText(this.textInfo.text, this.textInfo.style);
        this.infoBack.drawRoundedRect(this.downX - (this.textWH.width / 2) - (this.textWH.width / 4),this.downY - 1,this.textWH.width + (this.textWH.width / 2),this.textWH.height + 3,15);
        this.infoBack.endFill();

        this.infoBack.visible = true;
        this.textInfo.visible = true;
    }
    
    this.stateRelease = function(){
        GDraggID = -1;
        this.isHovering = true;
        this.isDragging = false;
        this.clear();
        this.beginFill(colorUIHover,1);
        this.drawCircle(0,0,radius);
        this.endFill();
    }

    this.stateOut = function(){
        GDraggID = -1;
        this.isHovering = false;
        this.isDragging = false;
        this.clear();
        this.beginFill(colorUINormal,1);
        this.drawCircle(0,0,radius);
        this.endFill();
        this.infoBack.visible = false;
        this.textInfo.visible = false;
    }
    
    this.stateMove = function(event){
        //console.log(this.isDragging);
        //console.log(this.valueType);
        if (!this.isDragging) return;
        evPos = event.data.getLocalPosition(this.parent);
        //console.log(evPos);
        nowX = evPos.x; nowY = evPos.y;


        this.x = this.downGrX + nowX - this.downX;
        this.y = this.downGrY + nowY - this.downY;
        if (this.x<eqGraphX) this.x = eqGraphX;
        if (this.x>eqGraphX + eqGraphW) this.x = eqGraphX + eqGraphW;
        if (this.y<eqGraphY) this.y = eqGraphY;
        if (this.y>eqGraphY + eqGraphH) this.y = eqGraphY + eqGraphH;
        this.infoBack.x = this.x; this.infoBack.y = this.y + radius*1.25;
        this.textID.x = this.x; this.textID.y = this.y;
        this.textInfo.x = this.x; this.textInfo.y = this.y + radius*1.25;

        this.freq = Math.round(Math.pow(2,Math.log2(eqGraphMin) + (Math.log2(eqGraphMax)-Math.log2(eqGraphMin))*(this.x-eqGraphX)/eqGraphW));
        this.gain = ((eqGraphY + eqGraphH / 2 - this.y) * 2 * this.range / eqGraphH).toFixed(1);

        if (Inited)
        {
            //console.log(id);
            EQFX[id-1].frequency.value = this.freq;
            EQFX[id-1].gain.value = this.gain
            updateAudioFX();
        }

        this.clear();
        this.beginFill(colorUIDown,0.3);
        this.drawCircle(0,0,radius);
        this.endFill();
        this.infoBack.visible = true;
        this.textWH = PIXI.TextMetrics.measureText(this.textInfo.text, this.textInfo.style);
        this.textInfo.visible = true;
        this.textInfo.text = makeEQStr(this.freq, this.q, this.gain);
    }
    this.graphics
        .on('pointerdown', this.stateDown)
        .on('pointerup', this.stateRelease)
        .on('pointerupoutside', this.stateOut)
        .on('pointerover', this.stateHover)
        .on('pointerout', this.stateNormal)
        .on('pointermove', this.stateMove);

}

function Button(x, y ,width, height, radius, text, onClick, shadow = false)
{
    this.graphics = new PIXI.Graphics();
    //if(shadow) this.graphics.filters = [uiShadowFilter];
    this.graphics.isMouseDown = false;
    this.shape = new PIXI.RoundedRectangle(x, y, width, height, radius);
    this.graphics.interactive = true;
    this.graphics.hitArea = this.shape;
    this.text = new PIXI.Text(text);
    this.text.x = x + width/2;
    this.text.y = y + height/2;
    this.text.anchor.set(0.5);
    this.text.style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'white',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 16,
    });
    app.stage.addChild(this.graphics);
    app.stage.addChild(this.text);
    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawRoundedRect(x,y,width,height,radius);
    this.graphics.endFill();

    this.stateNormal = function(){
        //this.isMouseDown = false;
        this.clear();
        this.beginFill(colorUINormal,1);
        this.drawRoundedRect(x,y,width,height,radius);
        this.endFill();
    }

    this.stateOut = function(){
        this.isMouseDown = false;
        this.clear();
        this.beginFill(colorUINormal,1);
        this.drawRoundedRect(x,y,width,height,radius);
        this.endFill();
    }

    this.stateDown = function(){
        this.isMouseDown = true;
        this.clear();
        this.beginFill(colorUIDown,1);
        this.drawRoundedRect(x,y,width,height,radius);
        this.endFill();
    }

    this.stateHover = function(){
        this.clear();
        this.beginFill(colorUIHover,1);
        this.drawRoundedRect(x,y,width,height,radius);
        this.endFill();
    }

    this.stateRelease = function(event){
        if(!this.isMouseDown) return;
        onClick(event);
        this.clear();
        this.beginFill(colorUIHover,1);
        this.drawRoundedRect(x,y,width,height,radius);
        this.endFill();
        this.isMouseDown = false;
    }


    this.graphics
        .on('pointerdown', this.stateDown)
        .on('pointerup', this.stateRelease)
        .on('pointerupoutside', this.stateOut)
        .on('pointerover', this.stateHover)
        .on('pointerout', this.stateNormal);
}

function CheckBox(x, y, size_outer, size_inner, radius_outer, radius_inner, text, onClick, id, defaultChecked = false)
{
    this.graphics = new PIXI.Graphics();
    this.graphics.isMouseDown = false;
    this.shape = new PIXI.RoundedRectangle(x, y, size_outer, size_outer, radius_outer);
    this.graphics.interactive = true;
    this.graphics.hitArea = this.shape;
    this.innerRect = new PIXI.Graphics();
    this.graphics.innerRect = this.innerRect;
    this.graphics.id = id;
    this.graphics.checked = defaultChecked;
    this.text = new PIXI.Text(text);
    this.text.x = x + size_outer*1.2;
    this.text.y = y + size_outer/2;
    this.text.anchor.set(0, 0.5);
    this.text.style = new PIXI.TextStyle({
        'align' : 'left',
        'fill' : 'black',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 17
    });
    app.stage.addChild(this.graphics);
    app.stage.addChild(this.innerRect);
    app.stage.addChild(this.text);

    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawRoundedRect(x, y, size_outer, size_outer, radius_outer);
    this.graphics.endFill();
    this.innerRect.beginFill(colorUIChecked,1);
    this.innerRect.drawRoundedRect(x + (size_outer-size_inner)/2, y+ (size_outer-size_inner)/2, size_inner, size_inner, radius_inner);
    this.innerRect.endFill();
    this.innerRect.visible = defaultChecked; //console.log(this.innerRect.visible);

    this.stateNormal = function(){
        //this.isMouseDown = false;
        this.clear();
        this.beginFill(colorUINormal,1);
        this.drawRoundedRect(x, y, size_outer, size_outer, radius_outer);
        this.endFill();
    }

    this.stateOut = function(){
        this.isMouseDown = false;
        this.clear();
        this.beginFill(colorUINormal,1);
        this.drawRoundedRect(x, y, size_outer, size_outer, radius_outer);
        this.endFill();
    }

    this.stateDown = function(){
        this.isMouseDown = true;
        this.clear();
        this.beginFill(colorUIDown,1);
        this.drawRoundedRect(x, y, size_outer, size_outer, radius_outer);
        this.endFill();
    }

    this.stateHover = function(){
        this.clear();
        this.beginFill(colorUIHover,1);
        this.drawRoundedRect(x, y, size_outer, size_outer, radius_outer);
        this.endFill();
    }

    this.stateRelease = function(event){
        if(!this.isMouseDown) return;
        this.checked = !this.checked;
        this.innerRect.visible = this.checked;
        if (onClick!=null) onClick(event, this.id, this.checked);
        this.clear();
        this.beginFill(colorUIHover,1);
        this.drawRoundedRect(x, y, size_outer, size_outer, radius_outer);
        this.endFill();
        this.isMouseDown = false;
    }


    this.graphics
        .on('pointerdown', this.stateDown)
        .on('pointerup', this.stateRelease)
        .on('pointerupoutside', this.stateOut)
        .on('pointerover', this.stateHover)
        .on('pointerout', this.stateNormal);
}

function EQMask(x, y ,w ,h){
    SetupEQChunk();
    this.graphics = new PIXI.Graphics();
    app.stage.addChild(this.graphics);
    this.graphics.beginFill(0xFFFFFF,1);
    this.graphics.drawRect(x,y,w,h);
    this.graphics.endFill();
    this.graphics.texts = [];

    for(let i=0;i<EQChunks.length;i++){
        let ChunkX = EQChunks[i].X - 1;
        this.graphics.beginFill(colorHex(150,150,150),1.0);
        this.graphics.drawRect(ChunkX,eqGraphY,2,eqGraphH - 13);
        this.graphics.endFill();
        for(let j=0.1;j<=0.9;j+=0.1){
            let color = Math.round(ClampColor(225 + (j * 35)));
            this.graphics.beginFill(colorHex(color,color,color),1.0);
            this.graphics.drawRect(eqGraphX + eqGraphW * ((Math.log2(EQChunks[i].Start + j * (EQChunks[i].End - EQChunks[i].Start)) - Math.log2(eqGraphMin)) / (Math.log2(eqGraphMax) - Math.log2(eqGraphMin)))-1,eqGraphY,2,eqGraphH - 13);
            this.graphics.endFill();
        }
        this.graphics.beginFill(colorUINormal,1.0);
        this.graphics.drawRect(ChunkX,eqGraphY + eqGraphH - 13,Math.round(EQChunks[i].Width)+1,13);
        this.graphics.endFill();

        this.graphics.texts[i] = new PIXI.Text(GetEQString(EQChunks[i].Start));
        this.graphics.texts[i].x = ChunkX + 2;
        this.graphics.texts[i].y = eqGraphY + eqGraphH - 13;
        //this.text.anchor.set(-0.1,0);
        this.graphics.texts[i].style = new PIXI.TextStyle({
            //'align' : 'left',
            'fill' : 'white',
            'fontFamily' : 'Microsoft Yahei',
            'fontSize' : 12
        });
        app.stage.addChild(this.graphics.texts[i]);
    }
    this.graphics.beginFill(colorHex(210,210,210),1.0);
    for(let i = 0;i<=2;i++)
        this.graphics.drawRect(eqGraphX,eqGraphY + ((eqGraphH / 2) + i * 40),eqGraphW,1);
    for(let i = 1;i<=2;i++)
        this.graphics.drawRect(eqGraphX,eqGraphY + ((eqGraphH / 2) - i * 40),eqGraphW,1);
    this.graphics.endFill();
    return this.graphics;
}

function ControlButton(x, y, w, h,radius, onClick, shadow = false)
{
    this.graphics = new PIXI.Graphics();
    this.isMouseDown = false;
    this.shape = new PIXI.RoundedRectangle(x, y, w, h, radius);
    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawRoundedRect(x,y,w,h,radius);
    this.graphics.endFill();
    this.graphics.interactive = true;
    this.graphics.hitArea = this.shape;
    this.graphics.text = new PIXI.Text("▶");
    this.graphics.text.x = x + w/2;
    this.graphics.text.y = y + h/2;
    this.graphics.text.anchor.set(0.5);
    this.graphics.text.style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'white',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 26
    });
    app.stage.addChild(this.graphics);
    app.stage.addChild(this.graphics.text);
    //this.graphics.filters = [uiShadowFilter];

    this.stateNormal = function(){
        this.clear();
        this.beginFill(colorUINormal,1);
        this.drawRoundedRect(x,y,w,h,radius);
        this.endFill();
    }

    this.stateOut = function(){
        this.isMouseDown = false;
        this.clear();
        this.beginFill(colorUINormal,1);
        this.drawRoundedRect(x,y,w,h,radius);
        this.endFill();
    }

    this.stateDown = function(){
        this.isMouseDown = true;
        this.clear();
        this.beginFill(colorUIDown,1);
        this.drawRoundedRect(x,y,w,h,radius);
        this.endFill();
    }

    this.stateHover = function(){
        this.clear();
        this.beginFill(colorUIHover,1);
        this.drawRoundedRect(x,y,w,h,radius);
        this.endFill();
    }

    this.stateRelease = function(event){
        if (!this.isMouseDown) return;
        if(CanPlay){
            let Playing = onClick(event);
            if(Playing){
               this.text.text = "▶";
                this.text.x = x + w/2;
                this.text.y = y + h/2; 
            } else {
                this.text.text = "‖";//"| |";
                this.text.x = x + w/2;
                this.text.y = y + h/2 - 2;
            }
        }
        
        this.clear();
        this.beginFill(colorUIHover,1);
        this.drawRoundedRect(x,y,w,h,radius);
        this.endFill();
        this.isMouseDown = false;
    }
    this.setState = function(MusicPlaying,Graphics){
        if(!MusicPlaying){
            Graphics.graphics.text.text = "▶";
            Graphics.graphics.text.x = x + w/2;
            Graphics.graphics.text.y = y + h/2;
        } else {
            Graphics.graphics.text.text = "‖";//"| |";
            Graphics.graphics.text.x = x + w/2;
            Graphics.graphics.text.y = y + h/2 - 2;
        }
        
        Graphics.graphics.clear();
        Graphics.graphics.beginFill(colorUINormal,1);
        Graphics.graphics.drawRoundedRect(x,y,w,h,radius);
        Graphics.graphics.endFill();
    }


    this.graphics
        .on('pointerdown', this.stateDown)
        .on('pointerup', this.stateRelease)
        .on('pointerupoutside', this.stateOut)
        .on('pointerover', this.stateHover)
        .on('pointerout', this.stateNormal);
}

function SliderHorizontalAdaptive(x, y, width, height, radius, text, defaultValue,type,min,max,customEvent = undefined)
{
    this.isDragging = false;
    let ScaleValue = max - min;
    defaultValue = min >= 0 ? defaultValue / ScaleValue * 100 : (defaultValue - min)/ScaleValue * 100; 
    this.value = defaultValue;
    this.graphics = new PIXI.Graphics();
    this.graphics.min = min;
    this.graphics.max = max;
    this.shape = new PIXI.RoundedRectangle(x, y, width, height, radius);
    this.graphics.interactive = true;
    this.graphics.hitArea = this.shape;
    this.text = new PIXI.Text(text);
    this.text.x = x + width/2;
    this.text.y = y + height*1.25;
    this.text.anchor.set(0.5,0);
    this.text.style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'black',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 17
    });
    this.graphicsFill = new PIXI.Graphics();
    this.graphicsTop = new PIXI.Graphics();
    app.stage.addChild(this.graphics);
    app.stage.addChild(this.graphicsFill);
    app.stage.addChild(this.graphicsTop);
    app.stage.addChild(this.text);
    
    this.graphics.lineStyle(2,colorUIDown,1);
    this.graphics.beginFill(colorUINormal,0.1);
    this.graphics.drawRoundedRect(x,y,width,height,radius);
    this.graphics.endFill();
    
    if(min < 0){
        this.graphicsFill.beginFill(colorUINormal,1);
        this.graphicsFill.drawRect(x+width*defaultValue/100,y,width / (ScaleValue / 100) - (width*defaultValue/100),height);
        this.graphicsFill.endFill();
    } else {
        this.graphicsFill.beginFill(colorUIDown,1);
        this.graphicsFill.drawRoundedRect(x,y,width*defaultValue/100,height,radius);
        this.graphicsFill.endFill();
    }
    this.graphicsTop.beginFill(colorUINormal,1);
    this.graphicsTop.drawCircle(x+width*defaultValue/100,y+height/2,height*1.2);
    this.graphicsTop.endFill();
    //Addition
    this.graphics.graphicsFill = this.graphicsFill;
    this.graphics.graphicsTop = this.graphicsTop;
    this.graphics.isDragging = false;
    this.graphics.value = defaultValue;
    this.graphics.text = this.text;
    this.graphics.valueType = type;

    this.stateNormal = function(){
        if(this.isDragging) return;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.stateDown = function(event){
        let ScaleValue = this.max - this.min;
        if(event.data.originalEvent.button != 0){
            if(this.valueType == 4 && Settings.AutoSetLimiterRelease){
                this.value = 60 / SongBPM * 100;
            } else if(this.valueType == "BPMSlider"){
                this.value = (DetectedBPM - 60) / 140 * 100;
            } else {
                this.value = defaultValue;
            }
            if(this.value >= 100)
                this.value = 100;
            if(this.value <= 0)
                this.value = 0;
            if(!customEvent){
                this.realvalue = LimiterProcessValue(this.min >= 0 ? this.value / 100 * this.max : this.min + (this.value / 100 * ScaleValue),this.valueType,this.min,this.max);
                this.text.text = DoLimiter(this.realvalue,this.valueType);
            } else {
                this.realvalue = this.min >= 0 ? this.value / 100 * this.max : this.min + (this.value / 100 * ScaleValue),this.valueType,this.min,this.max;
                this.text.text = customEvent(this.realvalue,this.valueType);
            }
            this.graphicsFill.clear();
            if(this.min >= 0){
                this.graphicsFill.beginFill(colorUIDown,1);
                this.graphicsFill.drawRoundedRect(x,y,width*this.value/100,height,radius);
                this.graphicsFill.endFill();
                this.graphicsTop.clear();
                this.graphicsTop.beginFill(colorUIDown,1);
                this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
                this.graphicsTop.endFill();
            } else {
                this.graphicsFill.beginFill(colorUINormal,1);
                this.graphicsFill.drawRect(x+width*this.value/100,y,width / (ScaleValue / 100) - (width*this.value/100),height);
                this.graphicsFill.endFill();
                this.graphicsTop.clear();
                this.graphicsTop.beginFill(colorUIDown,1);
                this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
                this.graphicsTop.endFill();
            }
            return;
        }
        this.isDragging = true;
        this.value = 100 * (event.data.getLocalPosition(this.parent).x - x)/width;
        if(this.value >= 100)
            this.value = 100;
        if(this.value <= 0)
            this.value = 0;
        if(!customEvent){
            this.realvalue = LimiterProcessValue(this.min >= 0 ? this.value / 100 * this.max : this.min + (this.value / 100 * ScaleValue),this.valueType,this.min,this.max);
            this.text.text = DoLimiter(this.realvalue,this.valueType);
        } else {
            this.realvalue = this.min >= 0 ? this.value / 100 * this.max : this.min + (this.value / 100 * ScaleValue),this.valueType,this.min,this.max;
            this.text.text = customEvent(this.realvalue,this.valueType);
        }
        this.graphicsFill.clear();
        if(this.min >= 0){
            this.graphicsFill.beginFill(colorUIDown,1);
            this.graphicsFill.drawRoundedRect(x,y,width*this.value/100,height,radius);
            this.graphicsFill.endFill();
            this.graphicsTop.clear();
            this.graphicsTop.beginFill(colorUIDown,1);
            this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
            this.graphicsTop.endFill();
        } else {
            this.graphicsFill.beginFill(colorUINormal,1);
            this.graphicsFill.drawRect(x+width*this.value/100,y,width / (ScaleValue / 100) - (width*this.value/100),height);
            this.graphicsFill.endFill();
            this.graphicsTop.clear();
            this.graphicsTop.beginFill(colorUIDown,1);
            this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
            this.graphicsTop.endFill();
        }
    }

    this.stateHover = function(){
        //this.isDragging = true;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIHover,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }
    
    this.stateRelease = function(){
        this.isDragging = false;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIHover,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.stateOut = function(){
        this.isDragging = false;
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }
    
    this.stateMove = function(event){
        if (!this.isDragging) return;
        let ScaleValue = this.max - this.min;
        this.value = 100 * (event.data.getLocalPosition(this.parent).x - x)/width;
        if(this.value >= 100)
            this.value = 100;
        if(this.value <= 0)
            this.value = 0;
        if(!customEvent){
            this.realvalue = LimiterProcessValue(this.min >= 0 ? this.value / 100 * this.max : this.min + (this.value / 100 * ScaleValue),this.valueType,this.min,this.max);
            this.text.text = DoLimiter(this.realvalue,this.valueType);
        } else {
            this.realvalue = this.min >= 0 ? this.value / 100 * this.max : this.min + (this.value / 100 * ScaleValue),this.valueType,this.min,this.max;
            this.text.text = customEvent(this.realvalue,this.valueType);
        }
        this.graphicsFill.clear();
        if(this.min >= 0){
            this.graphicsFill.beginFill(colorUIDown,1);
            this.graphicsFill.drawRoundedRect(x,y,width*this.value/100,height,radius);
            this.graphicsFill.endFill();
            this.graphicsTop.clear();
            this.graphicsTop.beginFill(colorUIDown,1);
            this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
            this.graphicsTop.endFill();
        } else {
            this.graphicsFill.beginFill(colorUINormal,1);
            this.graphicsFill.drawRect(x+width*this.value/100,y,width / (ScaleValue / 100) - (width*this.value/100),height);
            this.graphicsFill.endFill();
            this.graphicsTop.clear();
            this.graphicsTop.beginFill(colorUIDown,1);
            this.graphicsTop.drawCircle(x+width*this.value/100,y+height/2,height*1.2);
            this.graphicsTop.endFill();
        }
    }

    this.RefreshRelease = function(value){
        if(!Settings.AutoSetLimiterRelease) return;
        this.graphics.value = value*100;
        this.text.text = DoLimiter(value,4);
        this.graphicsFill.clear();
        this.graphicsFill.beginFill(colorUIDown,1);
        this.graphicsFill.drawRoundedRect(x,y,width*this.graphics.value/100,height,radius);
        this.graphicsFill.endFill();
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUIDown,1);
        this.graphicsTop.drawCircle(x+width*this.graphics.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.SetValue = function(value,text){ //0-100,Text
        this.graphics.value = value;
        this.text.text = text;
        this.graphicsFill.clear();
        this.graphicsFill.beginFill(colorUINormal,1);
        this.graphicsFill.drawRoundedRect(x,y,width*this.graphics.value/100,height,radius);
        this.graphicsFill.endFill();
        this.graphicsTop.clear();
        this.graphicsTop.beginFill(colorUINormal,1);
        this.graphicsTop.drawCircle(x+width*this.graphics.value/100,y+height/2,height*1.2);
        this.graphicsTop.endFill();
    }

    this.graphics
        .on('pointerdown', this.stateDown)
        .on('pointerup', this.stateRelease)
        .on('pointerupoutside', this.stateOut)
        .on('pointerover', this.stateHover)
        .on('pointerout', this.stateNormal)
        .on('pointermove', this.stateMove);
}

function WaveformButton(x, y, w, h,radius, onClick, shadow = true)
{
    this.graphics = new PIXI.Graphics();
    this.isMouseDown = false;
    this.shape = new PIXI.RoundedRectangle(x, y, w, h, radius);
    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawRoundedRect(x,y,w,h,radius);
    this.graphics.endFill();
    this.graphics.interactive = true;
    this.graphics.hitArea = this.shape;
    this.graphics.text = new PIXI.Text("▥");
    this.graphics.text.x = x + w/2;
    this.graphics.text.y = y + h/2;
    this.graphics.text.anchor.set(0.5);
    this.graphics.text.style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'white',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 26
    });
    app.stage.addChild(this.graphics);
    app.stage.addChild(this.graphics.text);
    //this.graphics.filters = [uiShadowFilter];

    this.stateNormal = function(){
        this.clear();
        this.beginFill(colorUINormal,1);
        this.drawRoundedRect(x,y,w,h,radius);
        this.endFill();
    }

    this.stateOut = function(){
        this.isMouseDown = false;
        this.clear();
        this.beginFill(colorUINormal,1);
        this.drawRoundedRect(x,y,w,h,radius);
        this.endFill();
    }

    this.stateDown = function(){
        this.isMouseDown = true;
        this.clear();
        this.beginFill(colorUIDown,1);
        this.drawRoundedRect(x,y,w,h,radius);
        this.endFill();
    }

    this.stateHover = function(){
        this.clear();
        this.beginFill(colorUIHover,1);
        this.drawRoundedRect(x,y,w,h,radius);
        this.endFill();
    }

    this.stateRelease = function(event){
        if (!this.isMouseDown) return;
        let inWaveform = onClick(event);
        if(inWaveform){
           this.text.text = "▥";
            this.text.x = x + w/2;
            this.text.y = y + h/2; 
        } else {
            this.text.text = "~";
            this.text.x = x + w/2;
            this.text.y = y + h/2 - 2;
        }
        
        this.clear();
        this.beginFill(colorUIHover,1);
        this.drawRoundedRect(x,y,w,h,radius);
        this.endFill();
        this.isMouseDown = false;
    }

    this.graphics
        .on('pointerdown', this.stateDown)
        .on('pointerup', this.stateRelease)
        .on('pointerupoutside', this.stateOut)
        .on('pointerover', this.stateHover)
        .on('pointerout', this.stateNormal);
}

function UiWaveSettings(x, y ,w ,h){
    this.UiControls = {};
    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(colorHex(255,255,255),0.5);
    this.graphics.drawRect(x,y,w,h);
    this.graphics.endFill();

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.graphics.lineStyle(1, colorUIHover, 1);
    this.graphics.moveTo(x + 165,y);
    this.graphics.lineTo(x + 165,y + h);
    this.graphics.moveTo(x + 165,y + 135);
    this.graphics.lineTo(x + w,y + 135);

    this.UiTexts = {};

    this.UiTexts["LimiterText"] = new PIXI.Text("压缩器");
    this.UiTexts["LimiterText"].x = x + w - 53;
    this.UiTexts["LimiterText"].y = y + 113;
    this.UiTexts["LimiterText"].style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'black',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 17
    });

    this.UiTexts["OtherText"] = new PIXI.Text("其他");
    this.UiTexts["OtherText"].x = x + w - 37;
    this.UiTexts["OtherText"].y = y + h - 105;
    this.UiTexts["OtherText"].style = new PIXI.TextStyle({
        'align' : 'center',
        'fill' : 'black',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 17
    });

    this.UiTexts["FPSText"] = new PIXI.Text(" FPS：0");
    this.UiTexts["FPSText"].x = x + 320;
    this.UiTexts["FPSText"].y = y + h - 25;
    this.UiTexts["FPSText"].style = new PIXI.TextStyle({
        'align' : 'center',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 17,

    });


    app.stage.addChild(this.graphics);
    for(i in this.UiTexts){
        app.stage.addChild(this.UiTexts[i]);
    }

    var addWidth = 146,addHeight = 38;
    var DefaultX = eqGraphX + 13,DefaultY = eqGraphY + 13;
    var uiX = DefaultX,uiY = DefaultY;

    //Base Region
    this.UiControls["sliderSmooth"] = new SliderHorizontal(uiX,uiY,140,8,3,"平滑：80%",80,2); uiY += addHeight;
    this.UiControls["sliderMinDecibels"] = new SliderHorizontal(uiX,uiY,140,8,3,"最小分贝：30%",30,3); uiY += addHeight;
    this.UiControls["sliderMaxDecibels"] = new SliderHorizontal(uiX,uiY,140,8,3,"最大分贝：80%",80,4); uiY += addHeight;
    this.UiControls["sliderVolume"] = new SliderHorizontal(uiX,uiY,140,8,3,"音量：50%", 50, 1); uiY += addHeight;
    this.UiControls["sliderFFT"] = new SliderFFT(uiX,uiY,140,8,3,7); uiY += addHeight;
    this.UiControls["sliderSpeed"] = new SliderSpeed(uiX,uiY,140,8,3,PlaySpeed+24.0); uiY += addHeight;


    //Limiter Region
    uiX = DefaultX + addWidth + 30; uiY = DefaultY;
    this.UiControls["sliderLimiterThresHold"] = new SliderHorizontalAdaptive(uiX,uiY,200,8,3,"触发阈值：-18 dB",-18,1,-100,0); uiX += (addWidth * 1.5);
    this.UiControls["sliderLimiterKnee"] = new SliderHorizontalAdaptive(uiX,uiY,200,8,3,"压缩拐点：14",14,2,0,40);uiX = DefaultX + addWidth + 30; uiY += addHeight;
    this.UiControls["sliderLimiterAttack"] = new SliderHorizontalAdaptive(uiX,uiY,200,8,3,"起始时间：10 ms",0.01,3,0,1); uiX += (addWidth * 1.5);
    this.UiControls["sliderLimiterRelease"] = new SliderHorizontalAdaptive(uiX,uiY,200,8,3,"释放时间：250 ms",0.25,4,0.001,1);uiX = DefaultX + addWidth + 30; uiY += addHeight;
    this.UiControls["sliderLimiterRatio"] = new SliderHorizontalAdaptive(uiX,uiY,200,8,3,"压缩比例：1:14",14,5,1,20);uiX += (addWidth * 1.5);
    this.UiControls["checkBoxAutoSetRelease"] = new CheckBox(uiX,uiY, 24,16,8,5,"自动设置释放时间",
        (event,id,state) => {
            Settings.AutoSetLimiterRelease = state;
        }
    ,"AutoSetRelease",true);

    //Other Region
    uiX = DefaultX + addWidth + 30; uiY = DefaultY + 135;
    this.UiControls["sliderBPM"] = new SliderHorizontalAdaptive(uiX,uiY,200,8,3,`BPM：125`,65,"BPMSlider",60,200,
        (value,id) => {
            value = 60 + Math.ceil(value / 200 * 140);
            SongBPM = value;
            sliderLimiterRelease.RefreshRelease(60 / value);
            return `BPM：${value}`;
        });
    uiY += addHeight - 3;
    this.UiControls["BPM/2Button"] = new Button(uiX,uiY,63,25,5,"BPM / 2",() => {
            value = Math.floor(SongBPM / 2);
            if(value < 60)
                return;
            if(value > 200)
                return;
            SongBPM = value;
            this.UiControls["sliderBPM"].SetValue((value - 60) / 140 * 100,`BPM：${value}`);
            sliderLimiterRelease.RefreshRelease(60 / value);
            ResetSideChainTime();
    },false);
    uiX += addWidth - 80;
    this.UiControls["BPMx2Button"] = new Button(uiX,uiY,63,25,5,"BPM × 2",() => {
            value = Math.floor(SongBPM * 2);
            if(value < 60)
                return;
            if(value > 200)
                return;
            SongBPM = value;
            this.UiControls["sliderBPM"].SetValue((value - 60) / 140 * 100,`BPM：${value}`);
            sliderLimiterRelease.RefreshRelease(60 / value);
            ResetSideChainTime();
    },false);
    uiX += addWidth - 80;
    this.UiControls["BPMDefault"] = new Button(uiX,uiY,70,25,5,"自动 BPM",() => {
            value = DetectedBPM;
            if(value < 60)
                return;
            if(value > 200)
                return;
            SongBPM = value;
            this.UiControls["sliderBPM"].SetValue((value - 60) / 140 * 100,`BPM：${value}`);
            sliderLimiterRelease.RefreshRelease(60 / value);
            ResetSideChainTime();
    },false);
    uiX += addWidth - 62;
    this.UiControls["SideChainVolume"] = new SliderHorizontalAdaptive(uiX,uiY,200,8,3,`侧链（需鼓声测量）：关闭`,0,"SideChainVolume",0,1,
    (value,id) => {
        value = value;
        for(let i=0;i<10;i++){
            let x = 1-(Math.sin((i / 10) / 0.5  * Math.PI) / (2 - (value / 1.0 * 0.88)));
            if(x >= 1.0)
                x = 1.0;
            if(x <= 0.2)
                x = 0.2;
            SideChainCurve[i] = parseFloat(x);
        }
        SideChainScale = value;
        return `侧链（需鼓声测量）：${value > 0 ? value.toFixed(2) : "关闭"}`;
    });
    
    uiY = DefaultY + 135;
    uiX += addWidth - 147;
    this.UiControls["DelayTime"] = new SliderHorizontalAdaptive(uiX,uiY,200,8,3,`输出延迟：0.0 s`,0,"DelayTime",0,1,
        (value,id) => {
            value = value.toFixed(1);
            DelayNode.delayTime.value = value;
            return `输出延迟：${value} s`;
        });
    uiY = DefaultY + 200;
    uiX = DefaultX + addWidth + 30;
    this.UiControls["AutoLinkSmooth"] = new CheckBox(uiX,uiY, 24,16,8,5,"自动设置平滑",
        (event,id,state) => {
            Settings.AutoSetSmooth = state;
        }
    ,"AutoLinkSmooth",true);
    uiX += addWidth + 60;
    this.UiControls["checkBoxAutoHRTF"] = new CheckBox(uiX,uiY, 24,16,8,5,"３　Ｄ　环　绕",
        (event,id,state) => {
            Settings.Auto3DHRTF = state;
        }
    ,"checkBoxAutoHRTF",false);

    this.graphicsButton = new Button(x + w - 55,y + h-30,50,25,5,"设置",SettingUiControl,false);
    return this;
}

function UiLevelMeter(x, y ,w ,h){
    this.graphics = new PIXI.Graphics();/*
    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawRoundedRect(x,y,w,h,6);
    this.graphics.endFill();*/
    //this.graphics.filters = [uiShadowFilter]; //Gank FPS

    this.graphicsBackground = new PIXI.Graphics();
    this.graphicsBackground.beginFill(0x000000,0.3);
    this.graphicsBackground.drawRect(x + 6,y + 5,w - 12,h - 10);
    this.graphicsBackground.endFill();

    this.graphicsBackground.beginFill(colorUINormal,1); //Split Line
    this.graphicsBackground.drawRect(Math.round(x + w  / 2) - 2,y + 5,3,h - 10);
    this.graphicsBackground.endFill();

    this.graphicsLevel = new PIXI.Graphics();
    this.graphicsLevelClipL = new PIXI.Graphics();
    this.graphicsLevelClipR = new PIXI.Graphics();
    this.graphicsLevelMask = new PIXI.Graphics();
    this.graphicsLevel.mask = this.graphicsLevelMask;
    this.graphicsLevelClipL.mask = this.graphicsLevelMask;
    this.graphicsLevelClipR.mask = this.graphicsLevelMask;

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    app.stage.addChild(this.graphics);
    app.stage.addChild(this.graphicsBackground);
    app.stage.addChild(this.graphicsLevel);
    app.stage.addChild(this.graphicsLevelClipL);
    app.stage.addChild(this.graphicsLevelClipR);

    this.graphicsLevel.beginFill(colorHex(86,255,184),1);
    this.graphicsLevel.drawRect(x + 6, y + 5, 15, h - 10);
    this.graphicsLevel.drawRect(Math.round(x + w  / 2) + 1,y + 5, 15,h - 10);
    this.graphicsLevel.endFill();
    this.graphicsLevelClipL.beginFill(colorHex(255,140,104),1);
    this.graphicsLevelClipL.drawRect(x + 6, y + 5, 15, h - 10);
    this.graphicsLevelClipL.endFill();
    this.graphicsLevelClipR.beginFill(colorHex(255,140,104),1);
    this.graphicsLevelClipR.drawRect(Math.round(x + w  / 2) + 1,y + 5, 15,h - 10);
    this.graphicsLevelClipR.endFill();
    for(i = y + 5; i < y + h - 10; i++)
    {
        let m = (i - y - 5)*2/(h - 10);
        if(m>1) break;
        //let Color = colorHex(86,255,184);
        //let Color = colorHex(255,140,104);
        let Color = colorHex(255, 255, 0);
        this.graphicsLevel.beginFill(Color,1-m);
        this.graphicsLevelClipL.beginFill(Color,1-m);
        this.graphicsLevelClipR.beginFill(Color,1-m);
        this.graphicsLevel.drawRect(x + 6, i, 15, 1);
        this.graphicsLevelClipL.drawRect(x + 6, i, 15, 1);
        this.graphicsLevel.drawRect(Math.round(x + w  / 2) + 1, i, 15, 1);
        this.graphicsLevelClipR.drawRect(Math.round(x + w  / 2) + 1, i, 15, 1);
    }
    this.graphicsLevel.endFill();
    this.graphicsLevelClipL.endFill();
    this.graphicsLevelClipR.endFill();
    this.graphicsLevelClipL.visible=false;
    this.graphicsLevelClipR.visible=false;

    this.clear = function(){
        LevelMeter.graphicsLevelMask.clear();
    }
    this.Refresh = function(ctx){
        this.graphicsLevelMask.clear();

        LVolume = LevelMeterNode.volume[0];
        RVolume = LevelMeterNode.volume[1];
        LevelMeterNode.checkClipping();

        LevelL = (--LVolume * LVolume * LVolume * LVolume * LVolume + 1) * (h - 10);//Math.ceil(LVolume * (h - 10));
        LevelR = (--RVolume * RVolume * RVolume * RVolume * RVolume + 1) * (h - 10);

        if(LevelMeterNode.clipping[0])
            this.graphicsLevelClipL.visible=true;//Color = colorHex(255,140,104);
        else this.graphicsLevelClipL.visible=false;

        this.graphicsLevelMask.beginFill(LevelMeterColor,1);
        this.graphicsLevelMask.drawRect(x + 6,y  + h - 5 - LevelL,15,LevelL);
        this.graphicsLevelMask.endFill();

        if(LevelMeterNode.clipping[1])
            this.graphicsLevelClipR.visible=true;//Color = colorHex(255,140,104);
        else this.graphicsLevelClipR.visible=false;

        this.graphicsLevelMask.beginFill(LevelMeterColor,1);
        this.graphicsLevelMask.drawRect(Math.round(x + w  / 2) + 1,y  + h - 5 - LevelR,15,LevelR);
        this.graphicsLevelMask.endFill();
    }

    return this;
}

function Ui3DHRTF(x, y ,w ,h){
    this.graphics = new PIXI.Graphics();
    this.graphics.rolloffFactor = PannerNode.rolloffFactor;
    this.graphics.isMouseDown = false;
    this.graphics.NowX = x + w / 2 + 1;
    this.graphics.NowY = y + (h - 50) / 2 + 1;

    this.shape = new PIXI.Rectangle(x, y, w, h - 50);
    this.graphics.interactive = true;
    this.graphics.hitArea = this.shape;
    this.graphics.beginFill(0xFFFFFF,1);
    this.graphics.drawRect(x,y,w,h);
    this.graphics.endFill();

    this.graphicsBottom = new PIXI.Graphics();
    this.graphicsBottom.beginFill(0xFFFFFF,1);
    this.graphicsBottom.drawRect(x,y + h - 48,w, 48);
    this.graphicsBottom.endFill();

    this.mask = new PIXI.Graphics();
    this.mask.isMask = true;
    this.mask.beginFill(0xFFFFFF,1);
    this.mask.drawRect(x,y,w,h - 48);
    this.mask.endFill();
    this.graphics.mask = this.mask;


    this.graphics.beginFill(colorUIHover,0.3);
    this.graphics.drawCircle(x + w / 2,y + (h - 50) / 2 ,220 - this.graphics.rolloffFactor * 15);
    this.graphics.drawCircle(x + w / 2,y + (h - 50) / 2 ,210 - this.graphics.rolloffFactor * 10);
    this.graphics.drawCircle(x + w / 2,y + (h - 50) / 2 ,200 - this.graphics.rolloffFactor * 5);
    this.graphics.endFill();

    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawRect(x,y + h - 50,w,2);
    this.graphics.endFill();

    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawRect(x,y + (h - 50) / 2,w,2);
    this.graphics.endFill();

    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawRect(x + w / 2 ,y ,2,h - 50);
    this.graphics.endFill();

    this.graphics.beginFill(colorUINormal,1);
    this.graphics.drawCircle(x + w / 2 + 1 ,y + (h - 50) / 2 + 1 ,6);
    this.graphics.endFill();

    this.graphics.px = x;
    this.graphics.py = y;
    this.graphics.pw = w;
    this.graphics.ph = h;

    app.stage.addChild(this.graphics);
    app.stage.addChild(this.graphicsBottom);
    this.graphicsSlider = new SliderHorizontalAdaptive(x + 120,y + h - 32,184,8,3,"衰减：1.00",1,"3DVolume",0,8.0,
        function(value,id){
            PannerNode.rolloffFactor = value;
            HRTFWindow.graphics.rolloffFactor = value;
            HRTFWindow.Refresh(value);
            return `衰减：${value.toFixed(2)}`;
        });
    this.EnableCheckbox = new CheckBox(x + 10,y + h - 35, 24,16,8,5,"开启 3D",
        function(event,ID,Enabled){
            if(Enabled){
                LimiterNode.disconnect(AnalyserNode);
                LimiterNode.connect(PannerNode);
            } else {
                LimiterNode.disconnect(PannerNode);
                LimiterNode.connect(AnalyserNode);
            }
        },"3DHRTF",false);

    this.Refresh = function(value){
        HRTFWindow.graphics.clear();
        HRTFWindow.graphics.beginFill(0xFFFFFF,1);
        HRTFWindow.graphics.drawRect(HRTFWindow.graphics.px,HRTFWindow.graphics.py,HRTFWindow.graphics.pw,HRTFWindow.graphics.ph);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUIHover,0.3);
        HRTFWindow.graphics.drawCircle(x + w / 2,y + (h - 50) / 2 ,220 - value * 15);
        HRTFWindow.graphics.drawCircle(x + w / 2,y + (h - 50) / 2 ,210 - value * 10);
        HRTFWindow.graphics.drawCircle(x + w / 2,y + (h - 50) / 2 ,200 - value * 5);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUINormal,1);
        HRTFWindow.graphics.drawRect(x,y + h - 50,w,2);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUINormal,1);
        HRTFWindow.graphics.drawRect(x,y + (h - 50) / 2,w,2);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUINormal,1);
        HRTFWindow.graphics.drawRect(x + w / 2 ,y ,2,h - 50);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUINormal,1);
        HRTFWindow.graphics.drawCircle(HRTFWindow.graphics.NowX,HRTFWindow.graphics.NowY,6);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUINormal,1);
        HRTFWindow.graphics.drawRect(x,y + h - 50,w,2);
        HRTFWindow.graphics.endFill();
    }
    this.stateDown = (event) => {
        if(Settings.Auto3DHRTF) return;
        if(event.data.originalEvent.button != 0){
            this.SetValue(this.graphics.px + this.graphics.pw / 2 + 1,this.graphics.py + (this.graphics.ph - 50) / 2 + 1);
            return;
        }
        this.graphics.isMouseDown = true;
    }
    this.stateRelease = function(event){
        this.isMouseDown = false;
    }
    this.stateOut = function(event){
        this.isMouseDown = false;
    }
    this.stateHover = function(event){}
    this.stateNormal = function(event){}
    this.stateMove = function(event){
        if(!this.isMouseDown) return;
        this.Pos = event.data.getLocalPosition(this);
        this.NowX = this.Pos.x;
        this.NowY = this.Pos.y;
        if(this.NowX <= this.px)
            this.NowX = this.px;
        if(this.NowX >= this.px + this.pw)
            this.NowX = this.px + this.pw;
        if(this.NowY <= this.py)
            this.NowY = this.py;
        if(this.NowY >= this.py + this.ph - 50)
            this.NowY = this.py + this.ph - 50;
        this.clear();
        this.beginFill(0xFFFFFF,1);
        this.drawRect(this.px,this.py,this.pw,this.ph);
        this.endFill();

        this.beginFill(colorUIHover,0.3);
        this.drawCircle(x + w / 2,y + (h - 50) / 2 ,220 - this.rolloffFactor * 15);
        this.drawCircle(x + w / 2,y + (h - 50) / 2 ,210 - this.rolloffFactor * 10);
        this.drawCircle(x + w / 2,y + (h - 50) / 2 ,200 - this.rolloffFactor * 5);
        this.endFill();

        this.beginFill(colorUINormal,1);
        this.drawRect(x,y + h - 50,w,2);
        this.endFill();

        this.beginFill(colorUINormal,1);
        this.drawRect(x,y + (h - 50) / 2,w,2);
        this.endFill();

        this.beginFill(colorUINormal,1);
        this.drawRect(x + w / 2 ,y ,2,h - 50);
        this.endFill();

        this.beginFill(colorUINormal,1);
        this.drawCircle(this.NowX,this.NowY,6);
        this.endFill();

        this.beginFill(colorUINormal,1);
        this.drawRect(x,y + h - 50,w,2);
        this.endFill();

        let CalcY = (this.NowY - (this.py + this.ph / 2 - 50)) / this.ph * (3.402 * 2);
        let CalcX = (this.NowX - (this.px + this.pw / 2)) / this.pw * (3.402 * 2);

        PannerNode.setPosition(CalcX,CalcY,CalcY / 2);
    }

    this.SetValue = (ix,iy) => {
        HRTFWindow.graphics.NowX = ix;
        HRTFWindow.graphics.NowY = iy;
        if(HRTFWindow.graphics.NowX <= HRTFWindow.graphics.px)
            HRTFWindow.graphics.NowX = HRTFWindow.graphics.px;
        if(HRTFWindow.graphics.NowX >= HRTFWindow.graphics.px + HRTFWindow.graphics.pw)
            HRTFWindow.graphics.NowX = HRTFWindow.graphics.px + HRTFWindow.graphics.pw;
        if(HRTFWindow.graphics.NowY <= HRTFWindow.graphics.py)
            HRTFWindow.graphics.NowY = HRTFWindow.graphics.py;
        if(HRTFWindow.graphics.NowY >= HRTFWindow.graphics.py + HRTFWindow.graphics.ph - 50)
            HRTFWindow.graphics.NowY = HRTFWindow.graphics.py + HRTFWindow.graphics.ph - 50;
        HRTFWindow.graphics.clear();
        HRTFWindow.graphics.beginFill(0xFFFFFF,1);
        HRTFWindow.graphics.drawRect(HRTFWindow.graphics.px,HRTFWindow.graphics.py,HRTFWindow.graphics.pw,HRTFWindow    .graphics.ph);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUIHover,0.3);
        HRTFWindow.graphics.drawCircle(x + w / 2,y + (h - 50) / 2 ,220 - this.graphics.rolloffFactor * 15);
        HRTFWindow.graphics.drawCircle(x + w / 2,y + (h - 50) / 2 ,210 - this.graphics.rolloffFactor * 10);
        HRTFWindow.graphics.drawCircle(x + w / 2,y + (h - 50) / 2 ,200 - this.graphics.rolloffFactor * 5);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUINormal,1);
        HRTFWindow.graphics.drawRect(x,y + h - 50,w,2);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUINormal,1);
        HRTFWindow.graphics.drawRect(x,y + (h - 50) / 2,w,2);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUINormal,1);
        HRTFWindow.graphics.drawRect(x + w / 2 ,y ,2,h - 50);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUINormal,1);
        HRTFWindow.graphics.drawCircle(HRTFWindow.graphics.NowX,HRTFWindow.graphics.NowY,6);
        HRTFWindow.graphics.endFill();

        HRTFWindow.graphics.beginFill(colorUINormal,1);
        HRTFWindow.graphics.drawRect(x,y + h - 50,w,2);
        HRTFWindow.graphics.endFill();

        let CalcY = (HRTFWindow.graphics.NowY - (HRTFWindow.graphics.py + HRTFWindow.graphics.ph / 2 - 50)) / HRTFWindow.graphics.ph * (3.402 * 2);
        let CalcX = (HRTFWindow.graphics.NowX - (HRTFWindow.graphics.px + HRTFWindow.graphics.pw / 2)) / HRTFWindow.graphics.pw * (3.402 * 2);

        PannerNode.setPosition(CalcX,CalcY,CalcY / 2);
    }
    this.graphics
    .on('pointerdown', this.stateDown)
    .on('pointerup', this.stateRelease)
    .on('pointerupoutside', this.stateOut)
    .on('pointerover', this.stateHover)
    .on('pointerout', this.stateNormal)
    .on('pointermove', this.stateMove);
    return this;
}

function SettingUiControl(){
    isSettingWindowOpen = !isSettingWindowOpen;
    WaveSettingWindow.graphics.visible = isSettingWindowOpen;
    for(i in WaveSettingWindow.UiControls){
        if(WaveSettingWindow.UiControls[i].graphics.interactive != undefined)
            WaveSettingWindow.UiControls[i].graphics.interactive = isSettingWindowOpen;
        WaveSettingWindow.UiControls[i].graphics.visible = isSettingWindowOpen;
        if(WaveSettingWindow.UiControls[i].innerRect != undefined)
            WaveSettingWindow.UiControls[i].innerRect.visible = isSettingWindowOpen ? WaveSettingWindow.UiControls[i].graphics.checked : false;
        if(WaveSettingWindow.UiControls[i].graphicsFill != undefined)
            WaveSettingWindow.UiControls[i].graphicsFill.visible = isSettingWindowOpen;
        if(WaveSettingWindow.UiControls[i].graphicsTop != undefined)
            WaveSettingWindow.UiControls[i].graphicsTop.visible = isSettingWindowOpen;
        if(WaveSettingWindow.UiControls[i].text != undefined)
            WaveSettingWindow.UiControls[i].text.visible = isSettingWindowOpen;
    }
    for (i in WaveSettingWindow.UiTexts){
        WaveSettingWindow.UiTexts[i].visible = isSettingWindowOpen;
    }
}

// === End UIControl ===
function getAverageVolume(array) {
    //var values = 0;
    var average;

    //var length = array.length;

    // get all the frequency amplitudes
    //for (var i = 0; i < length; i++) {
    //    values += array[i];
    //}

    average = Math.max(...Array.from(array))//values / length;
    return average;
}

function DoLimiter(value,id){
    switch(id){
        case 1:{
            if(LimiterNode != undefined)
                LimiterNode.threshold.setValueAtTime(value, Howler.ctx.currentTime);
            return `触发阈值：${value} dB`;
        };
        case 2:{
            if(LimiterNode != undefined)
                LimiterNode.knee.setValueAtTime(value, Howler.ctx.currentTime);
            return `压缩拐点：${value}`;
        };
        case 3:{
            if(LimiterNode != undefined)
                LimiterNode.attack.setValueAtTime(value, Howler.ctx.currentTime);
            return `起始时间：${(value * 1000).toFixed(0)} ms`;
        };
        case 4:{
            if(LimiterNode != undefined)
                LimiterNode.release.setValueAtTime(value, Howler.ctx.currentTime);
            return `释放时间：${(value * 1000).toFixed(0)} ms`;
        };
        case 5:{
            if(LimiterNode != undefined)
                LimiterNode.ratio.setValueAtTime(value, Howler.ctx.currentTime);
            return `压缩比例：1:${value}`;
        };
    }
    return "Unknown:" + value;
}

function LimiterProcessValue(value,id,min,max){
    if(value >= max)
        value = max;
    if(value <= min)
        value = min;
    switch(id){
        case 4:{ //Release
            let SafeValue = Math.abs(LimiterNode.threshold.value) / 500; //Save Your Ear
            if(value <= SafeValue)
                value = SafeValue;
            return value;
        }
        case 1:{ //Threshold
            let Value = Math.round(value);
            let SafeValue = Math.abs(LimiterNode.threshold.value) / 500; //Save Your Ear
            if(LimiterNode.release.value <= SafeValue){
                LimiterNode.release.setValueAtTime(SafeValue, Howler.ctx.currentTime);
                sliderLimiterRelease.RefreshRelease(SafeValue);
            }

            return Value;
        }
        case 2://Knee
        case 5:{//Ratio
            return Math.round(value);
        }
    }
    return value;
}

//MathUtil
function colorHex(r, g, b)
{
    return r*65536+g*256+b;
}
function ClampColor(color){
    if(color >= 255)
        color = 255;
    if(color < 0)
        color = 0;
    return color;
}
function ScaleColor(value,scaleto,invertBlack = false){
    Scaled = Math.round(ClampColor(value / 255.0 * scaleto));
    return invertBlack ? Scaled : 255 - Scaled;
}
function Mul(value,scale){
    return value * scale;
}
//Audio Util
function ControlMusic(){
    let IsMusicPlaying = Music != undefined && Music.playing();
    if(IsMusicPlaying){
        Music.pause();
        return true;
    } else if(Music != undefined){
        Music.play();
        return false;
    } else {
        Music.play();
        return false;
    }
}

//Window Util
function ControlWindow(event){
    if(isInWaveformWindow){
        WaveSettingWindow.graphics.visible = false;
        for (i in WaveSettingWindow.UiControls){
            if(WaveSettingWindow.UiControls[i].graphics.interactive != undefined)
                WaveSettingWindow.UiControls[i].graphics.interactive = false;
            WaveSettingWindow.UiControls[i].graphics.visible = false;
            if(WaveSettingWindow.UiControls[i].innerRect != undefined)
                WaveSettingWindow.UiControls[i].innerRect.visible = false;
            if(WaveSettingWindow.UiControls[i].graphicsFill != undefined)
                WaveSettingWindow.UiControls[i].graphicsFill.visible = false;
            if(WaveSettingWindow.UiControls[i].graphicsTop != undefined)
                WaveSettingWindow.UiControls[i].graphicsTop.visible = false;
            if(WaveSettingWindow.UiControls[i].text != undefined)
                WaveSettingWindow.UiControls[i].text.visible = false;
        }
        for (i in WaveSettingWindow.UiTexts){
            WaveSettingWindow.UiTexts[i].visible = false;
        }
    } else {
        WaveSettingWindow.graphics.visible = isSettingWindowOpen;
        for (i in WaveSettingWindow.UiControls){
            if(WaveSettingWindow.UiControls[i].graphics.interactive != undefined)
                WaveSettingWindow.UiControls[i].graphics.interactive = isSettingWindowOpen;
            WaveSettingWindow.UiControls[i].graphics.visible = isSettingWindowOpen;
            if(WaveSettingWindow.UiControls[i].innerRect != undefined)
                WaveSettingWindow.UiControls[i].innerRect.visible = isSettingWindowOpen ? WaveSettingWindow.UiControls[i].graphics.checked : false;
            if(WaveSettingWindow.UiControls[i].graphicsFill != undefined)
                WaveSettingWindow.UiControls[i].graphicsFill.visible = isSettingWindowOpen;
            if(WaveSettingWindow.UiControls[i].graphicsTop != undefined)
                WaveSettingWindow.UiControls[i].graphicsTop.visible = isSettingWindowOpen;
            if(WaveSettingWindow.UiControls[i].text != undefined)
                WaveSettingWindow.UiControls[i].text.visible = isSettingWindowOpen;
        }
        for (i in WaveSettingWindow.UiTexts){
            WaveSettingWindow.UiTexts[i].visible = isSettingWindowOpen;
        }
    }
    WaveSettingWindow.graphicsButton.graphics.visible = !isInWaveformWindow;
    WaveSettingWindow.graphicsButton.text.visible = !isInWaveformWindow;

    uiSpectrumCurve.visible = isInWaveformWindow;
    EQIndicator.visible = isInWaveformWindow;
    for (text of EQIndicator.texts) {
        text.visible = isInWaveformWindow;
    }
    for (DragCircles of EQDragList) {
        DragCircles.graphics.visible = isInWaveformWindow;
        DragCircles.textID.visible = isInWaveformWindow;
        DragCircles.graphics.interactive = isInWaveformWindow;
    }
    isInWaveformWindow = !isInWaveformWindow;
    return isInWaveformWindow;
}
function InitWindow(){
    isInWaveformWindow = !isInWaveformWindow;
    ControlWindow(undefined);
}

InitMusic();
//Spectrum&Curve

//=== Main ===

document.getElementById('FileSelector').addEventListener("change", onFileChanged, true);
//image
var borderSize = 160;
var imageSize = 240;
var personMask = new PIXI.Graphics();
personMask.isMask = true;
personMask.beginFill(0xffffff, 1);
personMask.drawRect(-borderSize,-borderSize,borderSize*2,borderSize*2);
personMask.endFill();
personMask.position.set(530,230);

var imagePerson = PIXI.Sprite.from(document.getElementById('photo'));//cq

console.log("Image size:" + imagePerson.width + "," + imagePerson.height);

//console.log(imagePerson.texture.baseTexture.realWidth + "," + imagePerson.height);
//imagePerson.width=200; imagePerson.height = 300;
//console.log(imagePerson.width + "," + imagePerson.height);

var imageW = imageSize, imageH = imageSize * (imagePerson.height/imagePerson.width), imageScale = 1;
//imagePerson.height = imageW;
//imagePerson.width = imageH;
/*
imagePerson.texture.baseTexture.on('loaded', loadTextureAction);
function loadTextureAction()
{    
    console.log("Loaded:" + imagePerson.width + " " + imagePerson.height);
    imageW = imageSize;
    imageH = imageSize * (imagePerson.height/imagePerson.width);
    imagePerson.height = imageW;
    imagePerson.width = imageH;
    //console.log(imageW, imageH);
    //imagePerson.scale.set(1);
}*/

var personBack = new PIXI.Graphics();

imagePerson.anchor.set(0.5);
imagePerson.position.set(530,230);
imagePerson.scale.set(1,1);
imagePerson.mask = personMask;

personBack.position.set(530,230);
personBack.mask = personMask;

personBack.beginFill(0x000000, 1);
personBack.drawRect(-200,-200,400,400);
personBack.endFill();

app.stage.addChild(personMask);

app.stage.addChild(personBack);
app.stage.addChild(imagePerson);
//image filter
var imageColorFilter = new PIXI.filters.ColorMatrixFilter;
imagePerson.filters = [imageColorFilter];
//imageColorFilter.blackAndWhite(true);
//imageColorFilter.saturate(1,true);
imageColorFilter.saturate(-1,false);
//imageColorFilter.saturate(1,false);

//image frame
var personFrame = new PIXI.Graphics();
var personFrameText = new PIXI.Text();
app.stage.addChild(personFrame);
personFrame.addChild(personFrameText);
personFrame.position.set(530,230);
personFrame.lineStyle(30, colorHex(128,96,0), 1);


personFrame.moveTo(-borderSize, -borderSize);
personFrame.lineTo(borderSize, -borderSize);
personFrame.lineTo(borderSize, borderSize);
personFrame.lineTo(-borderSize, borderSize);
personFrame.lineTo(-borderSize, -borderSize);

//personFrame.drawRoundedRect(-40-5,borderSize-40-5,80+10,80+10,50);//bug
personFrame.beginFill(colorHex(128,96,0),1);
personFrame.lineStyle(0);
personFrame.drawRoundedRect(-40,borderSize-25,80,50,10);
personFrame.endFill();
personFrame.lineStyle(20, colorHex(158,140,0), 1);

personFrame.moveTo(-borderSize, -borderSize);
personFrame.lineTo(borderSize, -borderSize);
personFrame.lineTo(borderSize, borderSize);
personFrame.lineTo(-borderSize, borderSize);
personFrame.lineTo(-borderSize, -borderSize);

//personFrame.lineStyle(28, colorHex(158,140,0), 1);



personFrame.lineStyle(12, 0, 1);
personFrame.beginFill(colorHex(255,255,255),1);
personFrame.lineStyle(0);
personFrame.drawRoundedRect(-35,borderSize-20,70,40,10);
personFrame.endFill();
personFrameText.position.set(0,borderSize+3);
personFrameText.anchor.set(0.5);
personFrameText.style = new PIXI.TextStyle({
    'align' : 'center',
    'color' : 'black',
    'fill' : 'black',
    'fontFamily' : 'Microsoft Yahei',
    'fontSize' : 35,
    'padding' : 5,
    'fontWeight' : 'bolder'
});
personFrameText.text = '奠';

uiBottomGraphics.lineStyle(30, 0xffffff, 1);
uiBottomGraphics.moveTo(530-borderSize, 230-borderSize);uiBottomGraphics.lineTo(530+borderSize, 230-borderSize);uiBottomGraphics.lineTo(530+borderSize, 230+borderSize);uiBottomGraphics.lineTo(530-borderSize, 230+borderSize);uiBottomGraphics.lineTo(530-borderSize, 230-borderSize);
//uiBottomGraphics.drawRoundedRect(530-40,230+borderSize-40,80,80,10);

//misc shapes 500 230
var shapeSpeakerPos = [[250,160],[250,300],[810,160],[810,300]];
var shapeSpeaker = new Array();
for (i = 0; i< shapeSpeakerPos.length; i++)
{
    newSpeaker = new PIXI.Graphics();
    newSpeaker.position.set(shapeSpeakerPos[i][0],shapeSpeakerPos[i][1]);
    newSpeaker.beginFill(0x999999,1);
    newSpeaker.drawCircle(0,0,48);
    newSpeaker.beginFill(0x333333,1);
    newSpeaker.drawCircle(0,0,40);
    newSpeaker.endFill();
    shapeSpeaker.push(newSpeaker);
    app.stage.addChild(newSpeaker);
    //console.log(newSpeaker.scale);
}
uiBottomGraphics.lineStyle(0);
uiBottomGraphics.beginFill(0x666666,1);
uiBottomGraphics.drawRoundedRect(170,55,160,350,5);
uiBottomGraphics.drawRoundedRect(730,55,160,350,5);
uiBottomGraphics.endFill();

uiBottomGraphics.lineStyle(5,0,1,1);
uiBottomGraphics.beginFill(0xffffff,1);
uiBottomGraphics.drawRoundedRect(20,55,130,350,5);
uiBottomGraphics.drawRoundedRect(910,55,130,350,5);
uiBottomGraphics.drawRoundedRect(355,5,350,45,5);
uiBottomGraphics.endFill();

var bigTextStyle = new PIXI.TextStyle({
    'align' : 'center',
    'color' : 'black',
    'fill' : 'black',
    'fontFamily' : 'Microsoft Yahei',
    'fontSize' : 65,
    'lineHeight' : 80,
    'padding' : 5,
    'fontWeight' : 'bolder'
});
var topTextStyle = new PIXI.TextStyle({
    'align' : 'center',
    'color' : 'black',
    'fill' : 'black',
    'fontFamily' : 'Microsoft Yahei',
    'fontSize' : 28,
    'letterSpacing' : 15,
    'padding' : 5,
    'fontWeight' : 'bolder'
});
var textBigL = new PIXI.Text(), textBigR = new PIXI.Text(), textTop = new PIXI.Text();
app.stage.addChild(textBigL); app.stage.addChild(textBigR); app.stage.addChild(textTop);
textBigL.anchor.set(0.5); textBigR.anchor.set(0.5); textTop.anchor.set(0.5);
textBigL.style = bigTextStyle; textBigR.style = bigTextStyle; textTop.style = topTextStyle;
textBigL.position.set(85,245); textBigR.position.set(975,245); textTop.position.set(530,29);
textBigL.text = "梦\n断\n北\n堂"; textBigR.text = "香\n消\n玉\n殒"; textTop.text = "古千龙张";

var pooArr = new Array(), pooArrTmp = new Array();
function PooParticle(x, y){
    this.poo = new PIXI.Text();
    this.x0=x, this.y0=y; 
    this.poo.style = new PIXI.TextStyle({
        'align' : 'center',
        'color' : 'white',
        'fontFamily' : 'Microsoft Yahei',
        'fontSize' : 30,
    });
    this.poo.text = "💩";
    this.poo.anchor.set(0.5);
    this.poo.position.set(this.x0,this.y0);
    app.stage.addChild(this.poo);
    this.t = 0; 
    this.alpha = 0.5;
    this.Refresh = function(dt)
    {
        this.t += dt/1000;
        this.poo.rotation = Math.PI*8*this.t;
        this.poo.position.set(this.x0,this.y0 + 250* this.t^2 );
        this.alpha = 0.5 - this.t;
        if (this.alpha < 0 )this.alpha = 0;
        this.poo.alpha = this.alpha;
    }
}
var generatePoo = false,LastGenerateTime = 0.0;
function generatePooDown(event)//老鼠下
{
    if(event.data.originalEvent.button != 0)
        return;
    generatePoo = true;
    pooArr.push(new PooParticle(event.data.getLocalPosition(this.parent).x, event.data.getLocalPosition(this.parent).y));
}
function generatePooMove(event)//老鼠跑了
{
    if(performance.now() < LastGenerateTime)
        return;
    if (generatePoo) pooArr.push(new PooParticle(event.data.getLocalPosition(this.parent).x, event.data.getLocalPosition(this.parent).y));
    LastGenerateTime = performance.now() + 50;
}
function generatePooUp(event)//老鼠上
{
    generatePoo = false;
}
uiBottomInteract.on('pointerdown', generatePooDown).on('pointermove', generatePooMove).on('pointerup', generatePooUp);

//spectrum pixel
var eqSpectrumPixelArray = [], eqGainPixelArray=[];
for (i = 0; i<eqGraphH;i++)
{
    eqSpectrumPixelArray.push(0);
    eqGainPixelArray.push(0);
}

//debug text
/*
var debugFPS = new PIXI.Text('FPSText');
debugFPS.x = 5;
debugFPS.y = 5;
app.stage.addChild(debugFPS);
var DebugMousePos = new PIXI.Text('FPSText');
DebugMousePos.x = 5;
DebugMousePos.y = 27;
app.stage.addChild(DebugMousePos);
*/

 //Set Mask
/*uiBottomMask.lineStyle(0);
uiBottomMask.beginFill(0xffffff,1);
uiBottomMask.drawRect(0,0,app.view.width,eqGraphY);
uiBottomMask.drawRect(0,0,15,app.view.height);
uiBottomMask.drawRect(330,0,app.view.width,app.view.height);//(330,0,20,app.view.height);
//uiBottomMask.drawRect(eqGraphX+eqGraphW,eqGraphY,20,eqGraphH);
uiBottomMask.drawRect(0,eqGraphY+eqGraphH,app.view.width,app.view.height);
uiBottomMask.endFill();*/
//uiBottomGraphics.mask=uiBottomMask;
uiSpectrumMask.lineStyle(0);
uiSpectrumMask.beginFill(0xffffff,1);
uiSpectrumMask.drawRect(eqGraphX,eqGraphY,eqGraphW,eqGraphH);
uiSpectrumMask.endFill();
//Bottom UI
uiBottomGraphics.lineStyle(0);
uiBottomGraphics.beginFill(colorUINormal,1);
uiBottomGraphics.drawRoundedRect(10,eqGraphY-5,325,eqGraphH+10,6);
uiBottomGraphics.drawRoundedRect(eqGraphX-5,eqGraphY-5,eqGraphW+10,eqGraphH+10,6);
uiBottomGraphics.drawRoundedRect(LevelX,LevelY,LevelW,LevelH,6);
uiBottomGraphics.beginFill(0xffffff,1);
uiBottomGraphics.drawRect(eqGraphX,eqGraphY,eqGraphW,eqGraphH);
uiBottomGraphics.endFill(); var testblur = new PIXI.filters.BlurFilter(); 
//uiBottomGraphics.filters = [uiShadowFilter]; //uiBottomGraphics.filters = null;

WaveSettingWindow = new UiWaveSettings(eqGraphX,eqGraphY,eqGraphW,eqGraphH);

var LevelMeter = new UiLevelMeter(LevelX,LevelY,LevelW,LevelH);
//Interactive UI
var buttonHelp = new Button(10,710,160,40,5,"鸣谢",buttonShowHelpAction, true);
var buttonSelect = new Button(175,710,160,40,5,"载入音频",buttonSelectAction,true);
var sliderSmooth = WaveSettingWindow.UiControls["sliderSmooth"];
var sliderMinDecibels = WaveSettingWindow.UiControls["sliderMinDecibels"];
var sliderMaxDecibels = WaveSettingWindow.UiControls["sliderMinDecibels"];

var sliderLimiterThresHold = WaveSettingWindow.UiControls["sliderLimiterThresHold"];
var sliderLimiterKnee = WaveSettingWindow.UiControls["sliderLimiterKnee"];
var sliderLimiterAttack = WaveSettingWindow.UiControls["sliderLimiterAttack"];
var sliderLimiterRelease = WaveSettingWindow.UiControls["sliderLimiterRelease"];
var sliderLimiterRatio = WaveSettingWindow.UiControls["sliderLimiterRatio"];

var sliderVolume = WaveSettingWindow.UiControls["sliderVolume"];
var sliderFFT = WaveSettingWindow.UiControls["sliderFFT"];
var sliderSpeed = WaveSettingWindow.UiControls["sliderSpeed"];

var EQDragList = [];
for (i = 0; i < 8; i++) {
    EQDragList.push(new DragCircle(18,EQFreq[i],1.5,0,eqViewRange,i+1));
}

var PlayButton = new ControlButton(345,710,45,40,6,ControlMusic,true);
var WaveButton = new WaveformButton(1006,710,45,40,6,ControlWindow,true);

var HRTFWindow = new Ui3DHRTF(15,457,315,240);

var thanksImage = PIXI.Sprite.from('../image/thanks.png');
thanksImage.anchor.set(0.5);
thanksImage.position.set(530, 380);
thanksImage.interactive = true;
thanksImage.visible = false;
app.stage.addChild(thanksImage);
InitWindow();

drawEQCurve();
//Update
//var timeSum = 0;
//app.ticker.minFPS=60;
app.ticker.add(function(delta){
    PrevTime = CurrentTime;
    CurrentTime = performance.now();
    DeltaTime = CurrentTime - PrevTime; 
    if(CurrentTime >= LastFPSTime && WaveSettingWindow.UiTexts["FPSText"] != undefined){
        WaveSettingWindow.UiTexts["FPSText"].text = ` FPS：${Math.round(app.ticker.FPS)}`;
        LastFPSTime = CurrentTime + 300;
    }

    let IsMusicPlaying = Music != undefined && Music.playing();
    //Person image
    if(AnalyserNodeWaveform != undefined){
        AnalyserNodeSideChainDetect.getByteFrequencyData(arrayBitPersonScale);
        let PerAvg = arrayBitPersonScale.reduce(function(p,c,i){return p+(c-p)/(i+1)},0);
        let scaleStretch = ScaleImage(PerAvg / 255 * 1) / 1.35;

        let SpeakerScale = (LevelMeterNode.volume[0]+LevelMeterNode.volume[1])/2;
        imageScale = 1 + scaleStretch;
        imagePerson.width = imageW * imageScale;
        imagePerson.height = imageH * imageScale;
        imageColorFilter.saturate(-1 + 4 * scaleStretch,false);
        personFrameText.scale.set(1 + 0.4*scaleStretch);
        personFrameText.rotation = (-Math.PI/6 + Math.PI/3 * CurrentTime % 1) * scaleStretch / 2;
        for(i = 0; i < shapeSpeaker.length; i++)
        {
            shapeSpeaker[i].scale.set(1 + 0.6*SpeakerScale);
        }
    }

    //Spectrum
    LevelMeter.Refresh();
    if(IsMusicPlaying){
        if(Settings.Auto3DHRTF){
            ix = (HRTFWindow.graphics.px + ((HRTFWindow.graphics.pw) / 2)) + (Math.cos(((Howler.ctx.currentTime * 16) % 360) * Math.PI /180)*45);
            iy = (HRTFWindow.graphics.py + ((HRTFWindow.graphics.ph - 50) / 2)) + (Math.sin(((Howler.ctx.currentTime * 16) % 360) * Math.PI /180)*45);
            HRTFWindow.SetValue(ix,iy);
        }
        uiWaveProgressBar.Refresh();
        let color = 0;
        let alpha = 0.0;

        if(!isInWaveformWindow){
            uiSpectrumGraphics.clear();
            uiSpectrumGraphics.lineStyle(0);
            AnalyserNode.getByteFrequencyData(arrayBit);
            let gap = Math.ceil(arrayBit.length / eqGraphW);
            for (i = 0; i < eqGraphW; i++)
            {
                ax = Math.log2(eqGraphMin) + (Math.log2(eqGraphMax)-Math.log2(eqGraphMin))*(i-eqGraphX)/eqGraphW;
                f = Math.pow(2,ax);

                color = ClampColor(arrayBit[Math.round(f*gap)] * 2);
                alpha = ScaleAlpha(color/255);

                if (alpha>0.0)
                {
                    uiSpectrumGraphics.beginFill(colorUIHover,alpha);
                    uiSpectrumGraphics.drawRect(eqGraphX + i,eqGraphY,1,eqGraphH - 13);
                    uiSpectrumGraphics.endFill();
                }
            }
        } else if(LastGetWaveTime < CurrentTime){
            uiSpectrumGraphics.clear();
            uiSpectrumGraphics.lineStyle(1, colorUIHover, 1);
            AnalyserNodeWaveform.getByteTimeDomainData(arrayBitWaveform);

            let x = eqGraphX;
            var sliceWidth = eqGraphW * 1.0 / (arrayBitWaveform.length-1);
            for (i = 0; i < arrayBitWaveform.length; i++)
            {
                let v = arrayBitWaveform[i]/128.0,
                y = v * eqGraphH/2;
                if(i === 0)
                    uiSpectrumGraphics.moveTo(x,eqGraphY + y);
                else
                    uiSpectrumGraphics.lineTo(x,eqGraphY + y);

                x += sliceWidth;
            }
                LastGetWaveTime = CurrentTime + 16; //Dizziness in >60hz monitor
        }

    } else if(!isInWaveformWindow){
        uiSpectrumGraphics.clear();
    }
    while(pooArr.length > 0)
    {
        poo = pooArr.shift();
        poo.Refresh(DeltaTime);
        if (poo.alpha <= 0) delete poo;
        else pooArrTmp.push(poo);
        
    }
    while(pooArrTmp.length > 0)
    {
        pooArr.push(pooArrTmp.shift());   
    }
});

function testLog(){
    console.log("这是测试！");
}

function InitMusic()
{
    if(Music === undefined){
        Howler.usingWebAudio = true;
        // BGM 列表，随机抽取
        let bgmList = ['Bad Apple!!.m4a', '禁じざるをえない遊戯.m4a', '死を賭して.m4a', 'かわいい悪魔　〜 Innocence.m4a', '幽夢　〜 Inanimate Dream（未使用バージョン）.m4a', 'Romantic Children.m4a', 'プラスチックマインド.m4a', '魔鏡.m4a'];
        let bgm = bgmList[Math.floor(Math.random() * bgmList.length)];
        console.log(`BGM: ${bgm}`);
        Music = new Howl({
            src: [`../bgm/${bgm}`],
            autoplay: false,
            loop: false,
            onload: function(){
                BPMDetector.ProcessBuffer(Howler.AudioBuffer,function(BPM){
                    if(WaveDisplay != undefined)
                        WaveDisplay.Refresh(Howler.ctx);
                    MusicDuration = Music.duration();
                    SongBPM = BPMDetector.beat.BPM;
                    DetectedBPM = SongBPM;
                    sliderLimiterRelease.RefreshRelease(Math.floor(BPM.beat.ms) / 1000);
                    WaveSettingWindow.UiControls["sliderBPM"].SetValue((DetectedBPM - 60) / 140 * 100,`BPM：${DetectedBPM}`);
                    CanPlay = true;
                    Howler.DeleteAudioBuffer(); //We Dont need it now
                });
            },
            onend:function(){
                if(PlayButton != undefined)
                    PlayButton.setState(false,PlayButton);
                if(uiWaveProgressBar != undefined)
                    uiWaveProgressBar.WaveProgressBarCurrentTime = uiWaveProgressBar.graphics.Width;
                ResetSideChainTime();
            }
        });
    }
    if(sliderSpeed != undefined && sliderSpeed.graphics != undefined){
        sliderSpeed.resetDefault();
        updatePitch();
    }
    if(!Inited){
        this.AnalyserNode = Howler.ctx.createAnalyser();
        AnalyserNode.fftSize = 8192; //Max least lag time
        AnalyserNode.smoothingTimeConstant = 0.55;

        this.AnalyserNodeWaveform = Howler.ctx.createAnalyser();
        AnalyserNodeWaveform.fftSize = 512;
        AnalyserNodeWaveform.smoothingTimeConstant = 0.20;

        this.AnalyserNodeSideChainDetect = Howler.ctx.createAnalyser();
        AnalyserNodeSideChainDetect.fftSize = 2048;
        AnalyserNodeSideChainDetect.smoothingTimeConstant = 0.78;
        this.SideChainBassNode = Howler.ctx.createBiquadFilter();
        SideChainBassNode.frequency.value = 160;
        SideChainBassNode.type = "lowpass";

        arrayBit = new Uint8Array(AnalyserNode.frequencyBinCount);
        arrayBitWaveform = new Uint8Array(AnalyserNodeWaveform.frequencyBinCount);
        arrayBitPersonScale = new Uint8Array(8);

        this.LimiterNode = Howler.ctx.createDynamicsCompressor();
        LimiterNode.threshold.setValueAtTime(-6, Howler.ctx.currentTime);
        LimiterNode.knee.setValueAtTime(12, Howler.ctx.currentTime);
        LimiterNode.attack.setValueAtTime(0.01, Howler.ctx.currentTime);
        LimiterNode.release.setValueAtTime(0.25, Howler.ctx.currentTime);
        LimiterNode.ratio.setValueAtTime(4, Howler.ctx.currentTime);

        this.GainNode = Howler.ctx.createGain();

        this.DelayNode = Howler.ctx.createDelay();
        DelayNode.delayTime.value = 0;

        this.PannerNode = Howler.ctx.createPanner();
        PannerNode.panningModel = 'HRTF';
        PannerNode.distanceModel = 'inverse';
        PannerNode.coneInnerAngle = 360;
        PannerNode.coneOuterAngle = 0;
        PannerNode.coneOuterGain = 0;

        this.LevelMeterNode = createAudioMeter(Howler.ctx);

        //AnalyserNode.minDecibels = -60;
        //AnalyserNode.maxDecibels = -10;
        //Howler.masterGain.connect(AnalyserNode);
        //AnalyserNode.connect(Howler.ctx.destination);
        //EQ Module
    
        let EQPosX = 385;
        for(i=0; i<8; i++)
        {
            let Freq = ChunkStarts[i+1];// = 0;
            newEQ = Howler.ctx.createBiquadFilter();
            newEQ.type = "peaking";/*这里先改掉
            for(let i=0;i<EQChunks.length;i++){
                if(EQPosX >= EQChunks[i].X && EQPosX <= EQChunks[i].X + EQChunks[i].Width){
                    Freq =  EQChunks[i].Start + Math.round(((EQPosX - EQChunks[i].X) / EQChunks[i].Width) * (EQChunks[i].End - EQChunks[i].Start));
                    break;
                }
            }*/EQPosX = eqGraphX + eqGraphW * ((Math.log2(Freq) - Math.log2(eqGraphMin)) / (Math.log2(eqGraphMax) - Math.log2(eqGraphMin)));
            newEQ.frequency.value = Freq;//EQFreq[i];
            newEQ.gain.value = 0;
            newEQ.Q.value = 1.5;
            EQFX.push(newEQ); //console.log("Band " + i + ":" + EQ[i]);
    
            EQParam = {
                X : EQPosX,
                Y : 577,
                Freq : newEQ.frequency.value,
                Gain : newEQ.gain.value,
                Q : newEQ.Q.value,
            }
            EQ.push(EQParam);
            //EQPosX+=83;
        } 
    
        //EQ[3] = 24; EQ[4] = -24; EQ[5] = -24; EQFX[4].Q.value=123; EQFX[5].Q.value=123;//test
        //EQ[3] = 24; EQ[5] = 24; //test
        //console.log(Music.state());
        source = Howler.masterGain;
        //AnalyserNode.disconnect(0);
        destination = Howler.ctx.destination;
        source.disconnect(0);
        source.connect(EQFX[0]);
        for (i=0;i<7;i++)
        {
            EQFX[i].connect(EQFX[i+1]);
            EQFX[i].gain.forCurveValue = 0.0;//Fix For Firefox
        }
        EQFX[7].connect(LimiterNode);//EQFX[7].connect(Howler.ctx.destination);
        LimiterNode.connect(AnalyserNode);
        PannerNode.connect(AnalyserNode);
        AnalyserNode.connect(AnalyserNodeWaveform);

        AnalyserNode.connect(SideChainBassNode);
        SideChainBassNode.connect(AnalyserNodeSideChainDetect);

        AnalyserNodeWaveform.connect(GainNode);
        GainNode.connect(DelayNode);
        DelayNode.connect(destination);
        DelayNode.connect(LevelMeterNode);
        //LevelMeterNode.connect(destination);
        
        //Inited Flag
        Inited = true;
        //set State
        updateAudioBasic();
    } 

}

function buttonShowHelpAction()
{
    thanksImage.visible = !thanksImage.visible;
    if (thanksImage.visible) buttonHelp.text.text = "鸣谢";
    else buttonHelp.text.text = "鸣谢";
}

function ResetSideChainTime(){
    NextSideChainTime = 0.0;
    SideChainDetectedTime = 0.0;
    LastSeekTime = performance.now();
}

function buttonSelectAction()
{
    document.getElementById("FileSelector").click();
}

function getEQGraphGainValue(a, freq, Q, gain)
{
    let db, g, gm, gt;
    let aBand = 0.5 / Q ;
    //aBand = Math.log2(mBand);
    let aFreq = Math.log2(freq);
    
    let value = gain * Math.pow(Math.sqrt(2), - 1 * (a-aFreq) * (a-aFreq) / aBand / aBand );

    return value;
}

function onFileChanged(event) {
    var Selector =document.getElementById('FileSelector');
    if (Selector.files[0] != undefined && Selector.files[0].size > 0) {
         var file = Selector.files[0];
          var reader = new FileReader();
            if(Music != undefined){
                Music.stop();
                Music.unload();
                delete Music;
            }
            delete Music;
            WaveDisplay.ClearRect();
            uiWaveProgressBar.ClearRect();
            MusicDuration = 0.0;
            CanPlay = false;

            //CallBack
            reader.addEventListener('load', function() {
                var data = reader.result;
                // Create a Howler sound 
                Music = new Howl({
                    src: data,
                    //format: file.name.split('.').pop().toLowerCase(),
                    onload: function(){
                        BPMDetector.ProcessBuffer(Howler.AudioBuffer,function(BPM){
                            if(WaveDisplay != undefined)
                                WaveDisplay.Refresh(Howler.ctx);
                            MusicDuration = Music.duration();
                            SongBPM = BPMDetector.beat.bpm;
                            DetectedBPM = SongBPM;
                            WaveSettingWindow.UiControls["sliderBPM"].SetValue((DetectedBPM - 60) / 140 * 100,`BPM：${DetectedBPM}`);
                            sliderLimiterRelease.RefreshRelease(Math.floor(BPM.beat.ms) / 1000);
                            InitMusic();
                            CanPlay = true;
                            Howler.DeleteAudioBuffer(); //We Dont need it now
                        });
                    },
                    onend:function(){
                        if(PlayButton != undefined)
                            PlayButton.setState(false,PlayButton);
                        if(uiWaveProgressBar != undefined)
                            uiWaveProgressBar.WaveProgressBarCurrentTime = uiWaveProgressBar.graphics.Width;
                        ResetSideChainTime();
                    }
                }); 
                if(PlayButton != undefined)
                    PlayButton.setState(false,PlayButton);
            }); 
        reader.readAsDataURL(file);
    }
}

function updateAudioBasic()
{
    if (!Inited) return;
    Howler.volume(Volume / 100,Music);
    AnalyserNode.smoothingTimeConstant = Smooth / 100;
    AnalyserNode.minDecibels = -100 + MinDecibels;
    AnalyserNode.maxDecibels = -100 + MaxDecibels;
}

function updateAudioFX()
{
    if (!Inited) return;
    drawEQCurve();

}

function updatePitch()
{
    if(!Inited) return;
    //console.log("pitch:" + PlaySpeed);
    Music.rate(Math.pow(2, PlaySpeed/12));
    //Howler.masterGain.playbackRate = 1 + 0.01*PlaySpeed;
}

function canvasMouseUp(event){
    generatePoo = false;
}
function canvasMouseMove(event){
    //DebugMousePos.text = event.clientX + " " + event.clientY;
}
function canvasMouseWheel(event)
{
    let wheelDir = false;
    let delta = 0;
    if(event.wheelDelta > 1)
        wheelDir = true;
    if ( event.wheelDelta ) { // will work in most cases
        delta = event.wheelDelta / 60;
    } else if ( event.detail ) { // fallback for Firefox
        delta = -event.detail / 2;
    }
    if ( delta !== null ) {
        direction = delta > 0 ? wheelDir = true : wheelDir = false;
    }
    for (i in EQDragList)
    {
        if (EQDragList[i].graphics.isHovering)
        {
            //console.log(EQDragList[i].graphics.id-1 + " " + wheelDir);
            if (wheelDir)
                EQDragList[i].graphics.q = EQDragList[i].graphics.q + 0.2;
            else EQDragList[i].graphics.q = EQDragList[i].graphics.q - 0.2;

            if (EQDragList[i].graphics.q < 0.1) EQDragList[i].graphics.q = 0.1;
            if (EQDragList[i].graphics.q > 10) EQDragList[i].graphics.q = 10;
            //console.log(EQDragList[i].graphics.q);
            EQDragList[i].graphics.q = Math.round(EQDragList[i].graphics.q * 10)/10;
            EQFX[EQDragList[i].graphics.id-1].Q.value = EQDragList[i].graphics.q;
            EQDragList[i].graphics.textInfo.text = makeEQStr(EQDragList[i].graphics.freq, EQDragList[i].graphics.q, EQDragList[i].graphics.gain);
            updateAudioFX();
            event.preventDefault();
            return(false);
        }
    }
}

function drawEQCurve()
{
    //ctx.fillStyle = "lightblue";
    //ctx.fillRect(eqGraphX,eqViewTop,eqGraphW,eqViewH);
    //ctx.fillStyle = "rgb(255,255,255)";
    //ctx.fillRect(eqGraphX,eqGraphY,eqGraphW,eqGraphH);
    //ctx.fill();
    uiSpectrumCurve.clear();
    uiSpectrumCurve.lineStyle(2,colorHex(0,200,150),1);
    uiSpectrumCurve.beginFill(0,0);
    for (i = eqGraphX; i <= eqGraphX + eqGraphW; i++)
    {
        var valueNow = 0;
        var ax = Math.log2(eqGraphMin) + (Math.log2(eqGraphMax)-Math.log2(eqGraphMin))*(i-eqGraphX)/eqGraphW;
        for (j = 0; j < EQFX.length; j++)
        {
            valueNow+=getEQGraphGainValue( ax, EQFX[j].frequency.value,EQFX[j].Q.value,EQFX[j].gain.value);
        }
        if (i == eqGraphX) uiSpectrumCurve.moveTo(i, eqGraphY + eqGraphH/2 - valueNow/eqRange*(eqGraphH/2));
        uiSpectrumCurve.lineTo(i, eqGraphY + eqGraphH/2 - valueNow/eqViewRange*(eqGraphH/2));
    }
    uiSpectrumCurve.endFill();
}

function getEQGraphGainValue(a, freq, Q, gain)
{
    var db, g, gm, gt, value;
    aBand = 0.5 / Q ;
    //aBand = Math.log2(mBand);
    aFreq = Math.log2(freq);
    
    value = gain * Math.pow(Math.sqrt(2), - 1 * (a-aFreq) * (a-aFreq) / aBand / aBand );

    return value;
}

function makeEQStr(freq, q, gain)
{
    
    result = "";
    result += (freq >= 1000 ?  (freq / 1000).toFixed(2)  + "kHz " : freq  + "Hz ") + gain + "db "+ q * 10 + "%";

    return result;
}
function GetEQString(value){
    if(value >= 1000)
        return (value / 1000) + "k";
    else return value + "Hz";
}
function ScaleAlpha(x){
    let ret = 1-Math.cos(x * 5 / Math.PI);
    if(ret >= 1)
        ret = 1;
    if(ret <= 0)
        ret = 0;
    return ret;
}
function ScaleImage(x){
    return x*x*x;
}
function createAudioMeter(audioContext) {
    var processor = audioContext.createScriptProcessor(512);
    processor.onaudioprocess = volumeAudioProcess;
    processor.clipping = [false,false];
    processor.lastClip = [0,0];
    processor.volume = [0,0];
    processor.clipLevel = 0.98;
    processor.averaging = 0.95;
    processor.clipLag = 750;

    // this will have no effect, since we don't copy the input to the output,
    // but works around a current Chrome bug.
    processor.connect(audioContext.destination);

    processor.checkClipping =
        function(){
            for(i in this.clipping){
                if (!this.clipping[i])
                    continue;
                if ((this.lastClip[i] + this.clipLag) < window.performance.now())
                    this.clipping[i] = false;
            }
            return this.clipping;
        };

    processor.shutdown =
        function(){
            this.disconnect();
            this.onaudioprocess = null;
        };

    return processor;
}
function volumeAudioProcess( event ) {
    GetVolume(event.inputBuffer.getChannelData(0),0,this);
    GetVolume(event.inputBuffer.getChannelData(1),1,this);
}
function GetVolume(BufferArray,channel,AudioProcesser){
    var bufLength = BufferArray.length;
    var sum = 0;
    var x;

    // Do a root-mean-square on the samples: sum up the squares...
    for (var i=0; i<bufLength; i++) {
        x = BufferArray[i];
        sum += x * x;
    }

    // ... then take the square root of the sum.
    var rms =  Math.sqrt(sum / bufLength);

    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    let volume = Math.max(rms, AudioProcesser.volume[channel]*AudioProcesser.averaging);
    if(volume >= 1.0)
        volume = 1.0;
    if (volume>=AudioProcesser.clipLevel) {
        AudioProcesser.clipping[channel] = true;
        AudioProcesser.lastClip[channel] = window.performance.now();
    }
    if(Music != undefined && Music.playing() && SideChainScale > 0){
        let CurrentMusicTime = Howler.ctx.currentTime;
        if(SideChainDetectedTime <= 0.0 && CurrentTime - LastSeekTime > ((60 / SongBPM / 2) + 1) * 1000)
            SideChainDetectedTime = IsOnBeat(AnalyserNodeSideChainDetect,Howler.ctx,SideChainScale,Music);
        if(SideChainDetectedTime > 0 && CurrentMusicTime >= NextSideChainTime/*Howler.ctx.currentTime >= NextSideChainTime*/){
            GainNode.gain.setValueCurveAtTime(SideChainCurve,CurrentMusicTime,60 / SongBPM / 2);
            NextSideChainTime = Howler.ctx.currentTime + ((60 / SongBPM));//Howler.ctx.currentTime + (60 / SongBPM);

        }
    } else ResetSideChainTime();
    AudioProcesser.volume[channel] = volume;
    delete x;
    delete sum;
}

console.log("%c欢迎来到俄苏维基动感灵堂！"," color: #d00; font-family: Microsoft Yahei; font-weight:bolder; text-shadow: 0 1px 0 #ccc,0 2px 0 #c9c9c9,0 3px 0 #bbb,0 4px 0 #b9b9b9,0 5px 0 #aaa,0 6px 1px rgba(0,0,0,.1),0 0 5px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.3),0 3px 5px rgba(0,0,0,.2),0 5px 10px rgba(0,0,0,.25),0 10px 10px rgba(0,0,0,.2),0 20px 20px rgba(0,0,0,.15);font-size:8em");
console.log("%cIshisashi 修改。在此感谢原作者。"," color: #fff; background-image:repeating-linear-gradient(-50deg, #000, #000 5px, #666 5px, #666 10px);padding:0.5em");
