'use strict';

var Location = {
    START: 0,
    PAUSE: 6
};

window.App = angular.module('PicoBrewing', ['ngResource', 'timer', 'elif']);

App.controller("SessionController", function($scope, $location, $http, $timeout) {

    $scope.config = {
        userId: '',
        machineId: '',
        pollingFrequency: 30 * 1000,
        debug: false,
        testServer: false
    };
    
    $scope.$watch('isBrewing', function (isBrewing, wasBrewing) {
        if (isBrewing) {
            getActiveSession()
                .then(function (sessionId) {
                    // if we already have a sessionId specified, check if it's the same as the active sessionId
                    if ($scope.config.sessionId) {
                        debug('requested session is the active session');
                        $scope.isActiveSession = $scope.config.sessionId === sessionId;
                    }
                    else {
                        debug('got the active session');
                        $scope.config.sessionId = sessionId;
                        $scope.isActiveSession = true;    
                    }
                });
        }
        else {
            if (wasBrewing) {
                debug('brew session has ended');
                $scope.isActiveSession = false;    
            }
        }
    });

    $scope.$watch('config.sessionId', function (sessionId, oldValue) {
        if (sessionId) {
            debug('a session was requested.  get the session details for', sessionId);
            getSessionInfo(sessionId)
                .then(addRecipeSteps)
                .then(getSessionLog)
                .then(processLogEntries)
                .then(function () {
                    $timeout(updateLogEntries, $scope.config.pollingFrequency);
                });
        }
    });

    $scope.updateUserId = function updateUserId (evt, val) {
        if (evt.which === 13) {
            $scope.config.userId = val;
            $location.search('userId', $scope.config.userId);
        }
    }

    $scope.updateId = function updateId (evt, key, val) {
        if (evt.which === 13) {
            $scope.config[key] = val;
            $location.search(key, val);
        }
    }

    init();
    checkIfCurrentlyBrewing();

    function init() {
        var queryParams = $location.search();
        $scope.config.userId = queryParams.userId;
        $scope.config.machineId = queryParams.machineId;
        $scope.config.sessionId = queryParams.sessionId;
        $scope.config.debug = queryParams.debug === 'true';
        $scope.isBrewing = false;
        $scope.isActiveSession = false;
        debug('userId from url: ', $scope.config.userId);
        debug('machineId from url: ', $scope.config.machineId);
        debug('sessionId from url: ', $scope.config.sessionId);
    }

    function checkIfCurrentlyBrewing () {
        return get('/Json/brewhouseJson.cshtml?user=' + $scope.config.userId + '&justname=5')
            .then(function (data) {
                $scope.isBrewing = data.data.replace(/"/g, '') === 'active';
                debug('currently brewing?', $scope.isBrewing);
                $timeout(checkIfCurrentlyBrewing, $scope.config.pollingFrequency);
                return $scope.isBrewing;
            });
    }

    function getActiveSession () {
        return get('/Json/brewhouseJson.cshtml?user=' + $scope.config.userId + '&justname=3')
            .then(function (data) {
                if (data.data !== '""') {
                    debug('active sessionId:', data.data.GUID);
                    return data.data.GUID;
                }
            });
    }

    function getSessionInfo (sessionId) {
        return get('/Json/brewhouseJson.cshtml?user=' + $scope.config.userId + '&requestGUID=' + sessionId + '&ignoreWhetherCurrent=true&justname=3')
            .then(function (data) {
                data = data.data;
                if (data === '""') {
                    console.error('no data for sessionId', data);
                    return;
                }
                debug('session info: ', data);
                $scope.recipe = {
                    name: data.Name,
                    description: data.TastingNotes,
                    ibu: data.IBU,
                    og: data.OG,
                    srm: data.SRM,
                    style: data.StyleNameCode
                };
                $scope.session = {};
            });
    }

    function addRecipeSteps () {
        return getAllRecipes()
            .then(function (recipes) {
                var _recipe = _.findWhere(recipes, {name: $scope.recipe.name});
                // TODO:
                if (!_recipe) {
                    alert('The recipe for ' + $scope.recipe.name + ' could not be found.  Only recipes currently synced to your Zymatic can be viewed.')
                    return;
                }
                angular.extend($scope.recipe, _recipe);
                debug('current recipe: ', $scope.recipe);
            });
    }

    function getAllRecipes() {
        debug("getting all recipes");
        return get('/API/SyncUser?user=' + $scope.config.userId + '&machine=' + $scope.config.machineId)
            .then(parseRecipes);
    }

    function parseRecipes(data) {
        debug("parsing all recipes");
        data = data.data.slice(3, data.data.length-3);
        var recipeStrings = data.split('|');
        var recipes = [];
        recipeStrings.forEach(function (recipeString) {
            recipes.push(parseRecipe(recipeString));
        });
        return recipes;
    }

    function parseRecipe(string) {
        var recipeString = string.split('/');
        var recipe =  {
            name:  recipeString[0].trim(),
            id:    recipeString[1],
            steps: []
        };
        for (var i = 2; i < recipeString.length; i++) {
            if (recipeString[i]) {
                var steps = recipeString[i].split(',');
                var step = {
                    index:      i - 2,
                    name:       steps[0],
                    targetTemp: parseInt(steps[1]),
                    time:       parseInt(steps[2]) + parseInt(steps[4]),
                    location:   parseInt(steps[3]),
                };

                if (step.index === Location.START) {
                    // step 0 is a special case
                    step.tempTransition = step.targetTemp - 60;
                } else if (step.location !== Location.PAUSE) {
                    // 6 indicates pause
                    step.tempTransition = step.targetTemp - recipe.steps[step.index-1].targetTemp;
                } else if (step.location === Location.PAUSE && step.targetTemp === 0) {
                    step.targetTemp = recipe.steps[step.index-1].targetTemp;
                }

                recipe.steps.push(step);                
            }
        }
        return recipe;
    }

    function getSessionLog() {
        return get('/Json/brewhouseJson.cshtml?user=' + $scope.config.userId + '&requestGUID=' + $scope.config.sessionId + '&ignoreWhetherCurrent=true')
            .then(function (data) {
                if (data.data && data.data !== '""') {
                    return parseLogEntries(data.data);
                }
                else {
                    throw new Error('No log data');
                }
            });
    }

    function parseLogEntries (data) {
        var entries = [];
        data.split('|').forEach(function (entryString) {
            var entryElements = entryString.split(',');
            var entry = {
                date:     new Date(parseInt(entryElements[0].replace(/"/g, ''))),
                step:     entryElements[1].replace('null', ''),
                wortTemp: parseInt(entryElements[2]),
                note:     entryElements[7]
            };
            entries.push(entry);
        });
        return entries;
    }

    function updateLogEntries () {
        getSessionLog()
            .then(processLogEntries)
            .finally(function () {
                $timeout(updateLogEntries, $scope.config.pollingFrequency);
            });
    }

    function processLogEntries (log) {
        debug('processing log entries');
        $scope.session.startedAt = log[0].date;
        $scope.lastUpdated = log[log.length-1].date;
        var currentStep;
        var previousStep;
        for (var i = 0; i < log.length; i++) {
            var entry = log[i];
            if (entry.step) {
                debug(entry.date, entry.step);
                previousStep = currentStep;
                currentStep = currentStepFromEntry(entry);
                updatePreviousStep(previousStep, currentStep);
            }
            else {
                updateCurrentStepFromEntry(currentStep,  entry);
                // if it's the very last log entry and a completed session
                if (i === log.length-1 && !$scope.isActiveSession) {
                    currentStep.completedAt = entry.date;
                    currentStep.elapsedTimeInMin = Math.floor((currentStep.completedAt - currentStep.startedAt) / 1000 / 60);
                    currentStep.state = 'done';
                }
            }
        };

        attemptToDetectPauseStep(currentStep);

        $scope.currentTemp = currentStep.actualTemp;
        $scope.targetTemp = currentStep.targetTemp;

        $scope.session.elapsed = Math.floor(($scope.lastUpdated - log[0].date) / 1000 / 60);
        $scope.session.remaining = estimateRemainingTime();
        $scope.session.progressBar = Math.round(($scope.session.elapsed / ($scope.session.elapsed + $scope.session.remaining)) * 100);

        debug('actual elapsed time', $scope.session.elapsed, 'min');
        debug('remaining', $scope.session.remaining);
        debug('progress', $scope.session.progressBar);
    }

    function currentStepFromEntry (entry) {
        var step = findRecipeStep(entry.step);
        step.state = 'current';
        step.startedAt = entry.date;
        step.actualTemp = entry.wortTemp;
        return step;
    }

    function findRecipeStep (name) {
        return _.findWhere($scope.recipe.steps, {name: name});
    }

    function getNextStep (currentStep) {
        var index = currentStep.index + 1;
        if (index < $scope.recipe.steps.length) {
            return $scope.recipe.steps[index];
        }
    }

    function updatePreviousStep (previous, current) {
        if (previous) {
            previous.completedAt = current.startedAt;
            previous.elapsedTimeInMin = Math.floor((previous.completedAt - previous.startedAt) / 1000 / 60);
            debug(previous.name, "elapsed", previous.elapsedTimeInMin);

            // set the previous step to 'done', and make sure any steps
            // previous to it are also marked 'done'.  sometimes there's 
            // no log entry for the start of a step, so it can get missed.
            var done = false;
            for( var i = $scope.recipe.steps.length - 1; i >= 0; i--) {
                var step = $scope.recipe.steps[i];
                if (done) {
                    step.state = 'done';
                }
                done = done || step === current;
            }
        }
    }

    function updateCurrentStepFromEntry (step, entry) {
        if (step) {
            step.actualTemp = entry.wortTemp;
            if (step.tempTransition !== 0 && !step.tempTransitionMade) {
                // heating
                if (step.tempTransition > 0 && step.actualTemp >= step.targetTemp) {
                    step.tempTransitionMade = entry.date;
                }
                // chilling
                else if (step.tempTransition < 0 && step.actualTemp <= step.targetTemp) {
                    step.tempTransitionMade = entry.date;
                }
            }
        }
    }

    function attemptToDetectPauseStep (currentStep) {
        if (currentStep.state === 'current') {
            var nextStep = getNextStep(currentStep);
            if (nextStep && nextStep.location === Location.PAUSE) {
                if (currentStep.time && (currentStep.tempTransition === 0 || currentStep.tempTransitionMade)) {
                    var elapsedFrom = !!currentStep.tempTransitionMade ? currentStep.tempTransitionMade : currentStep.startedAt;
                    var elapsed = elapsed = Math.floor(($scope.lastUpdated - elapsedFrom) / 1000 / 60);
                    if (elapsed >= currentStep.time) {
                        debug('pause step detected!!!');
                        var previousStep = currentStep;
                        currentStep = nextStep;
                        currentStep.state = 'pause';
                        currentStep.startedAt = $scope.lastUpdated;
                        updatePreviousStep(previousStep, currentStep);
                    }
                }
            }
        }
    }

    function estimateRemainingTime() {
        var degPerMin = 2;
        var timeRemaining = 0;
        $scope.recipe.steps.forEach(function (step) {
            if (step.state === undefined) {
                timeRemaining += step.time;
                if (step.tempTransition) {
                    timeRemaining += Math.abs(Math.round(step.tempTransition/degPerMin));
                }
            }
            else if (step.state === 'current') {
                if (step.tempTransition && !step.tempTransitionMade) {
                    timeRemaining += Math.round(Math.abs(step.actualTemp - step.targetTemp)/degPerMin)
                    timeRemaining += step.time;
                }
                else {
                    // step is current and temp transition's been made IF there was one
                    // TODO: there is a bug here somewhere
                    var stepTimeMs = step.tempTransitionMade ? step.tempTransitionMade.getTime() : step.startedAt.getTime()
                        + (step.time * 60 * 1000) - $scope.lastUpdated.getTime();
                    timeRemaining += Math.round(stepTimeMs/1000/60);
                }
            }
        });
        return timeRemaining;
    }

    function debug () {
        if ($scope.config.debug) {
            console.log.apply(console, arguments);
        }
    }    

    function get(path) {
        var url = 'https://crossorigin.me/' + 'https://picobrew.com' + path + '&_=' + new Date().getTime();
        if ($scope.config.testServer) {
            url = 'http://localhost:4567' + path;
        }
        return $http.get(url);
    }
});

// replacement for moment/humanize.  I mostly want precision, except I want some fuzziness
// on the estimated time remaining that grows sharper as it gets closer.
App.filter('durationFormat', function () {
    return function (timeInMinutes, fuzz) {
        if (timeInMinutes) {
            var hours = Math.floor(timeInMinutes/60);
            var minutes = timeInMinutes % 60;

            if (hours === 0) {
                return minutes + ' minutes';
            }
            else if (hours > 0 && fuzz) {
                // round minutes to the quarter hour
                if (minutes >= 0 && minutes <=8) {
                    minutes = 0;
                }
                else if (minutes > 8 && minutes <= 23) {
                    minutes = 15;
                }
                else if (minutes > 23 && minutes <= 38) {
                    minutes = 30;
                }
                else if (minutes > 38 && minutes <= 52) {
                    minutes = 45;
                }
                else if (minutes > 52) {
                    minutes = 0;
                    hours += 1;
                }
                var output = hours + ' hour';
                if (hours > 1) { 
                    output += 's'; 
                }
                if (minutes > 0) {
                    output += ' ' + minutes + ' minutes';
                }
                return output;
            }
            else {
                return hours + 'h ' + minutes + 'm';
            }
        }
    };
});
