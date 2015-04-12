/**********************************************************************************************
    zl_TrimCompToContents
    Copyright (c) 2013 Zack Lovatt. All rights reserved.
    zacklovatt.com
 
    Name: zl_TrimCompToContents
    Version: 0.5
 
    Description:
        This script trims or lengthens your current comp to the in & out
        points of its contents.

        Originally requested by Alan Fregtman (darkvertex.com)

        This script is provided "as is," without warranty of any kind, expressed
        or implied. In no event shall the author be held liable for any damages 
        arising in any way from the use of this script.
        
**********************************************************************************************/

    var ignoreLocked;
    var preserveCompStart;
    var useAll = true;
    
    /****************************** 
        zl_TrimCompToContents()
    
        Description:
        This function contains the main logic for this script.
     
        Parameters:
        thisObj - "this" object.
     
        Returns:
        Nothing.
    ******************************/
    function zl_TrimCompToContents(thisObj, useAll){

        // Force comp to active
/*        if (thisObj == null || !(thisObj instanceof CompItem)){
                        alert("bob");

            var tempWorkDur = thisComp.workAreaDuration;
            thisComp.workAreaDuration = thisComp.frameDuration * 2;
            thisComp.ramPreviewTest("",1,"");
            thisComp.workAreaDuration = tempWorkDur;
        }*/

        app.beginUndoGroup("zl_TrimCompToContents");

        var thisComp = app.project.activeItem;
        var layerCount = thisComp.numLayers;
        var userLayers = thisComp.selectedLayers;
        var lockedLayers = new Array;
        
        // Find the current start time, set it to 0, set it back at the end if the switch is thrown
        var oldDispStartFrame = thisComp.displayStartTime*(1/thisComp.frameDuration);
        thisComp.displayStartTime = 0;

        // Build our layer array based on either all layers or unlocked-only layers
        // Also build an array of locked layers, and unlock them. Will relock later.
        if (useAll == true){
            var j = 0;
            var k = 0;
            
            for (i = 0; i <= thisComp.layers.length-1; i++){ 
                if (ignoreLocked == true && thisComp.layers[i+1].locked == false){
                    userLayers[j] = thisComp.layers[i+1];
                    j++;
                } else if (ignoreLocked == false){
                    userLayers[i] = thisComp.layers[i+1];
                    if (thisComp.layers[i+1].locked == true){
                        lockedLayers[k] = thisComp.layers[i+1];
                        lockedLayers[k].locked = false;
                        k++
                    }
                } 
            }
        }
    
        // Error messages for either no layers selected / no layers detected
        // Otherwise, head on in and let's make some magic.
        if ((useAll == true) && (userLayers.length == 0)){
            alert ("No layers detected!");
        } else if ((useAll == false) && (userLayers.length == 0)){
            alert ("No layers selected!");
        } else {       
            var inTime = zl_TrimCompToContents_getInTime(userLayers);
            var outTime = zl_TrimCompToContents_getOutTime(userLayers);

            // If the earliest layer is before comp start, shift everything down 
            if (inTime < thisComp.displayStartTime){
                    zl_TrimCompToContents_shiftLayers(userLayers, inTime, thisComp);
                    inTime = 0; //zl_TrimCompToContents_getInTime(userLayers);
                    outTime = zl_TrimCompToContents_getOutTime(userLayers);
            }
    
            var newDur = outTime - inTime;

            // These correct for any issues dealing with floating point & fractional framerates
            if (newDur < thisComp.frameDuration)
                newDur = thisComp.frameDuration;
            if  ((inTime + newDur) > thisComp.duration)
                thisComp.duration += 1;

            // Set work area & trim!
            thisComp.workAreaStart = inTime;
            thisComp.workAreaDuration = newDur;
            
            app.executeCommand(app.findMenuCommandId("Trim Comp to Work Area"));
            
            // Re-lock those locked layers
            if (useAll == true)
                for (i = 0; i < lockedLayers.length; i++)
                    lockedLayers[i].locked = true;
        }

        // Check for preserve toggle, set it back.
        if (preserveCompStart == true){
            thisComp.displayStartTime = oldDispStartFrame*thisComp.frameDuration;
        } else {
            thisComp.displayStartTime = 0;
        }

        app.endUndoGroup();
    }


    /****************************** 
        zl_TrimCompToContents_getInTime()
          
        Description:
        This function gets the earliest inPoint for target layers
         
        Parameters:
        targetLayers - array of layers to analyze
        
        Returns:
        inPoint of earliest layer
     ******************************/
    function zl_TrimCompToContents_getInTime(targetLayers){
        var layerIndex = 0;

        for (i = 0; i <= targetLayers.length-1; i++)
            if (targetLayers[i].inPoint < targetLayers[layerIndex].inPoint)
                layerIndex = i;

        return targetLayers[layerIndex].inPoint;
    }


    /****************************** 
        zl_TrimCompToContents_getOutTime()
          
        Description:
        This function gets the earliest outPoint for target layers
         
        Parameters:
        targetLayers - array of layers to analyze
        
        Returns:
        outPoint of latest layer
     ******************************/
    function zl_TrimCompToContents_getOutTime(targetLayers){
        var layerIndex = 0;
        
        for (i = 0; i <= targetLayers.length-1; i++)
            if (targetLayers[i].outPoint > targetLayers[layerIndex].outPoint)
                layerIndex = i;
                
        return targetLayers[layerIndex].outPoint;
    }


    /****************************** 
        zl_TrimCompToContents_shiftLayers()
          
        Description:
        Shift all target layers forward in time to get out of negative inPoint
         
        Parameters:
        targetLayers - array of layers to analyze
        inTime - Amount of time to shift layers
        compFPS - Frame rate of comp
        
        Returns:
        Nothing
     ******************************/
    function zl_TrimCompToContents_shiftLayers(targetLayers, inTime, thisComp){
        var compFPS = 1/thisComp.frameDuration;
        var shiftFrames = Math.abs(inTime)*compFPS;
        var startTimeFrames = 0;
        var totalFrames = 0;
        
        for (i = 0; i <= targetLayers.length-1; i++){
            startTimeFrames = targetLayers[i].startTime*compFPS;
            totalFrames = startTimeFrames + shiftFrames;

            targetLayers[i].startTime = totalFrames/compFPS;
        }
    }


    /****************************** 
        zl_TrimCompToContents_createPalette()
          
        Description:
        Creates ScriptUI Palette Panel
        Generated using Boethos (crgreen.com/boethos)
        
        Parameters:
        thisObj - this comp object
        
        Returns:
        Nothing
     ******************************/
    function zl_TrimCompToContents_createPalette(thisObj) { 
        var win = (thisObj instanceof Panel) ? thisObj : new Window('palette', 'Script Window',[357,241,607,453]); 

        { // Trim Buttons
            win.trimAllButton = win.add('button', [22,19,226,45], 'Trim To All'); 
            win.trimAllButton.onClick = function () {
                zl_TrimCompToContents(thisObj, true);
            } 
            
            win.trimSelectedButton = win.add('button', [22,59,226,85], 'Trim To Selected'); 
            win.trimSelectedButton.onClick = function () {
                zl_TrimCompToContents(thisObj, false);
            } 
        }


        { // Advanced Options
            win.optionGroup = win.add('panel', [14,104,235,193], 'Advanced Options', {borderStyle: "etched"}); 
        
            win.ignoreLockedCheckbox = win.optionGroup.add('checkbox', [28,19,208,41], 'Ignore Locked Layers'); 
            win.ignoreLockedCheckbox.value = false; 
            win.ignoreLockedCheckbox.onClick = function(){
                ignoreLocked = this.value;
            }
    
            win.preserveStartCheckbox = win.optionGroup.add('checkbox', [28,49,208,71], 'Preserve Comp Start Time'); 
            win.preserveStartCheckbox.value = false; 
            win.preserveStartCheckbox.onClick = function(){
                preserveCompStart = this.value;
            }
        }
    
        if (win instanceof Window) {
            win.show();
        } else {
            win.layout.layout(true);
        }
    } // end function createPalette


    /****************************** 
        zl_TrimCompToContents_main()
          
        Description:
        Main function
        
        Parameters:
        thisObj - this comp object
        
        Returns:
        Nothing
     ******************************/
    function zl_TrimCompToContents_main(thisObj) {
        zl_TrimCompToContents_createPalette(thisObj);
    }

    // RUN!
    //zl_TrimCompToContents(this);
    zl_TrimCompToContents_main(this);