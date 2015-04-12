﻿/**********************************************************************************************
    zl_TrimCompToContents
    Copyright (c) 2013 Zack Lovatt. All rights reserved.
    zack@zacklovatt.com
 
    Name: zl_TrimCompToContents
    Version: 0.9
 
    Description:
        This script trims or lengthens your current comp to the in & out
        points of its contents.

        Originally requested by Alan Fregtman (darkvertex.com)

        This script is provided "as is," without warranty of any kind, expressed
        or implied. In no event shall the author be held liable for any damages 
        arising in any way from the use of this script.
        
**********************************************************************************************/

    var zl_TCC__ignoreLocked = false;
    var zl_TCC__preserveCompStart = false;
    var zl_TCC__useAll = true;
    var zl_TCC__scriptName = "zl_TrimCompToContents";
            
    /****************************** 
        zl_TrimCompToContents()
    
        Description:
        This function contains the main logic for this script.
     
        Parameters:
        thisObj - "this" object.
     
        Returns:
        Nothing.
    ******************************/
    function zl_TrimCompToContents(thisObj){

        var thisComp = app.project.activeItem;
        app.project.activeItem.selected = true;
        var layerCount = thisComp.numLayers;
        var userLayers = thisComp.selectedLayers;
        var lockedLayers = new Array;
        
        // Find the current start time, set it to 0, set it back at the end if the switch is thrown
        var oldDispStartFrame = thisComp.displayStartTime*(1/thisComp.frameDuration);
        thisComp.displayStartTime = 0;

        // Build our layer array based on either all layers or unlocked-only layers
        // Also build an array of locked layers, and unlock them. Will relock later.
        if (zl_TCC__useAll == true){
            var j = 0;
            var k = 0;
            for (i = 0; i <= thisComp.layers.length-1; i++){ 
                if (zl_TCC__ignoreLocked == true && thisComp.layers[i+1].locked == false){
                    userLayers[j] = thisComp.layers[i+1];
                    j++;
                } else if (zl_TCC__ignoreLocked == false){
                    userLayers[i] = thisComp.layers[i+1];
                    if (thisComp.layers[i+1].locked == true){
                        lockedLayers[k] = thisComp.layers[i+1];
                        lockedLayers[k].locked = false;
                        k++;
                    }
                } 
            }
        }
    
        // Error messages for either no layers selected / no layers detected
        // Otherwise, head on in and let's make some magic.
        if ((zl_TCC__useAll == true) && (userLayers.length == 0)){
            alert ("No layers detected!");
        } else if ((zl_TCC__useAll == false) && (userLayers.length == 0)){
            alert ("No layers selected!");
            zl_TCC__preserveCompStart = true;
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
            if (thisComp.duration < outTime){
                thisComp.duration = newDur + inTime + 1;
            }

            // Set work area & trim!
            thisComp.workAreaStart = inTime;
            thisComp.workAreaDuration = newDur;
            
            app.executeCommand(app.findMenuCommandId("Trim Comp to Work Area"));

            // Re-lock those locked layers
            if (zl_TCC__useAll == true)
                for (i = 0; i < lockedLayers.length; i++)
                    lockedLayers[i].locked = true;
        }

        // Check for preserve toggle, set it back.
        if (zl_TCC__preserveCompStart == true){
            thisComp.displayStartTime = oldDispStartFrame*thisComp.frameDuration;
        } else {
            thisComp.displayStartTime = 0;
        }
    } // end function TrimCompToContents


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
    } // end function getInTime


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
    } // end function getOutTime


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
    } // end function shiftLayers


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
        var win = (thisObj instanceof Panel) ? thisObj : new Window('palette', 'Trim Comp to Contents',[357,241,607,418]); 

        { // Buttons
            win.trimSelectedButton = win.add('button', [12,19,216,45], 'Trim Comp'); 
            win.trimSelectedButton.onClick = function () {
                if (app.project) {
                    var activeItem = app.project.activeItem;
                    
                    if (activeItem != null && (activeItem instanceof CompItem)) {
                        app.beginUndoGroup(zl_TCC__scriptName);
                        zl_TrimCompToContents(thisObj);
                        app.endUndoGroup();
                    } else {
                        alert("Select an active comp!", zl_TCC__scriptName);
                    }
                } else {
                    alert("Open a project!", zl_TCC__scriptName);
                }
            } 
        }


        { // Options
            win.optionGroup = win.add('panel', [14,64,235,154], 'Options', {borderStyle: "etched"}); 
        
            win.trimToAll = win.optionGroup.add('checkbox', [28,10,208,32], 'Trim To All'); 
            win.trimToAll.value = true; 
            win.trimToAll.onClick = function(){
                zl_TCC__useAll = this.value;
                win.ignoreLockedCheckbox.enabled =this.value;
            }
    
            win.ignoreLockedCheckbox = win.optionGroup.add('checkbox', [48,30,208,52], 'Ignore Locked Layers');
            win.ignoreLockedCheckbox.value = false; 
            win.ignoreLockedCheckbox.onClick = function(){
                zl_TCC__ignoreLocked = this.value;
            }
    
            win.preserveStartCheckbox = win.optionGroup.add('checkbox', [28,55,208,76], 'Preserve Comp Start Time'); 
            win.preserveStartCheckbox.value = false; 
            win.preserveStartCheckbox.onClick = function(){
                zl_TCC__preserveCompStart = this.value;
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
    } // end function main

    // RUN!
    // zl_TrimCompToContents(this); // <= This runs the script with default options, usually for debug
    zl_TrimCompToContents_main(this); // <= This brings up the panel