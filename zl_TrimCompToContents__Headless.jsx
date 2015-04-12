﻿/**********************************************************************************************
    zl_TrimCompToContents
    Copyright (c) 2013 Zack Lovatt. All rights reserved.
    zack@zacklovatt.com
 
    Name: zl_TrimCompToContents
    Version: 1.3
 
    Description:
        This script trims or lengthens your current comp to the in & out
        points of its contents.

                HEADLESS VERSION
                        For use w/ ft-toolbar or other script runners.
                        Defaults to use all layers, don't ignore locked
                    
                    Hold ALT to use SELECTED LAYERS instead of ALL
                    Hold SHIFT to IGNORE LOCKED LAYERS
                    Hold CTRL/CMD to PRESERVE COMP START TIME
                    
                               Any combination of the above will stack effects.
                    
        Originally requested by Alan Fregtman (darkvertex.com)

        This script is provided "as is," without warranty of any kind, expressed
        or implied. In no event shall the author be held liable for any damages 
        arising in any way from the use of this script.
        
**********************************************************************************************/

    var zl_TCC__scriptName = "zl_TrimCompToContents";
            
    /****************************** 
        zl_TrimCompToContents()
    
        Description:
        This function contains the main logic for this script.
     
        Parameters:
        thisObj - "this" object.
        useAll - use all layers (vs selected)
        ignoreLocked - ignore locked layers
        preserveStart - preserve start time
     
        Returns:
        Nothing.
    ******************************/
    function zl_TrimCompToContents(useAll, ignoreLocked, preserveStart){

        var thisComp = app.project.activeItem;
        app.project.activeItem.selected = true;
        var layerCount = thisComp.numLayers;
        var userLayers = thisComp.selectedLayers;
        var lockedLayers = new Array;
        
        // Find the current start time, set it to 0, set it back at the end if the switch is thrown
        var oldDispStart = timeToCurrentFormat(thisComp.displayStartTime, thisComp.frameRate, 0);
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
                        k++;
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
            preserveStart = true;
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
            
            //app.executeCommand(app.findMenuCommandId("Trim Comp to Work Area"));
            app.executeCommand(2360); 

            // Re-lock those locked layers
            if (useAll == true)
                for (i = 0; i < lockedLayers.length; i++)
                    lockedLayers[i].locked = true;
        }
    

        // Check for preserve toggle, set it back.
        if (preserveStart == true){
            thisComp.displayStartTime = currentFormatToTime(oldDispStart, thisComp.frameRate, 0) + 0.0001;
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
        zl_TrimCompToContents_main()
          
        Description:
        Main function
        
        Parameters:
        thisObj - this comp object
        
        Returns:
        Nothing
     ******************************/
    function zl_TrimCompToContents_main(thisObj) {
        var useAll = true;
        var ignoreLocked = false;
        var preserveStart = false;

        if (ScriptUI.environment.keyboardState.altKey){
            useAll = false;
        }
    
        if (ScriptUI.environment.keyboardState.shiftKey){
            ignoreLocked = true;
        }
    
        if ((ScriptUI.environment.keyboardState.ctrlKey) || (ScriptUI.environment.keyboardState.metaKey)){
            preserveStart = true;
        }
    
        app.beginUndoGroup(zl_TCC__scriptName);
        zl_TrimCompToContents(useAll, ignoreLocked, preserveStart);
        app.endUndoGroup();
    } // end function main

    // RUN!
    //         zl_TrimCompToContents(true, false, false); // <= This runs the script with default options, usually for debug
    zl_TrimCompToContents_main(this); // <= This brings up the panel