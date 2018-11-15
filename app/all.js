

var answers = [];
var stopcount = false;
var $answerblock = $('#leftside div:first');
var $answerblockright = $('#rightside div:first');
var answerTimes;

var tutorialplay;
var tutorialhub;
var maxTime = 60000;
var secondsLeft = 60000;


function startQuiz(play, hub) {
    if (isTutorialOn) {
        answerTimes = play.Pool.Answers;
    }

    var quiz = play.Quiz;
    var $quiz = $('#quiz_box');

    // This will store a list of the answers selected.
    // Set the time that the quiz started. This ideally should be set after the question/answers have been displayed.
    var startTime = IREP.getTimestamp();
    // Will be used to determine how long it took to answer each question. This is only needed if this quiz is being audited.
    var answerStartTime = startTime;

    // Loop through and display each question and answer set.
    for (var i = 0; i < quiz.Questions.length; ++i) {
        $quiz.append("<div class='question' id='Question" + i + "'>");

        $quizitem = $('#Question' + i + '');

        // Grab question information and add question text to page.
        var question = quiz.Questions[i];
        var $question = $('<h2/>', {
            html: question.QuestionText
        });
        $quizitem.append($question);

        // Create a parent container for answers for styling and event handling.
        var $ul = $('<div class="answers">');

        // Loop through and display each answer for this question.
        for (var j = 0; j < question.Answers.length; ++j) {
            var $div = $('<div/>', {
                "class": "table"
            });
            var answer = question.Answers[j];
            // Set the text as well as some data properties. Setting these data properties will make it easier to determine which question/answer the participant selected.
            var $answer = $('<div/>', {
                html: answer.AnswerText,
                "class": "col",
                data: {
                    questionId: question.QuestionId,
                    answerId: answer.AnswerId // This would be 0 if the participant didn't select an answer in time.
                }
            });

            $div.append($answer)
            $ul.append($div);
        }
        // Set an event for when the participant clicks an answer. Make sure to use jQuery.one so that it will prevent any accidental double clicks. 
        $ul.one('click', '.col', function () {
            var $answer = $(this);
            $answerblock.addClass('answered');
            $answerblock =$answerblock.next().next();
            // Set a beautiful class so we can style it.
            $answer.addClass('selected');
            $parentquestion = $answer.closest('.question');
            $parentquestion.fadeOut(250);
            setTimeout(function () {

                $parentquestion.next().show();

            }, 250);

            // Grab our question and answer ids that we will use to submit to the server.
            var questionId = $answer.data('questionId');
            var answerId = $answer.data('answerId');
            answers.push({
                questionId: questionId,
                answerId: answerId
            });

            // If we are auditing we need to know how long it took the participant to select this answer.
            var answerTime = Math.round(IREP.getTimestamp() - answerStartTime, 0);
            answerStartTime = IREP.getTimestamp();

            // If the quiz came back with a auditUID we know to submit this answer for auditing.
            if (quiz.AuditUID.length > 0) {

                IREP.callApi({
                    url: "/quiz/audit/answer",
                    type: "POST",
                    data: {
                        auditUID: quiz.AuditUID,
                        answerID: answerId,
                        answerTime: answerTime
                    }
                });
            }

            // the number of answers are the same as the number of questions we are supposed to ask. Then submit it to the server for processing.
            if (answers.length === quiz.Questions.length) {
                stopcount = false;

                $('#loadmessage').html('<span>' + (typeof(localeText[187517]) !== "undefined") ? localeText[187517] : localeText[185302] + '</span>');
                $("#loader").show();
                $('.quiz').hide();
                $('#quiz_box #TopBar #timer span').html(":60");
                $(".quizsummary").hide();
                play.Seconds = (maxTime - secondsLeft);
                hub.server.postPlay(IREP.user().currentUID, play, answers).done(function (data) {
                    quizcompleted(hub, IREP.user().currentUID, data);
                });
            }
        });
        
        $quizitem.append($ul);

    }
    $(".question:first").show();

    stopcount = true;
    if (!isTutorialOn) {
        startTime = IREP.getTimestamp();
        answerStartTime = startTime;
        //hub.server.updateQuizStartTimer(paxUid, play).done(function (data) {
            timer(play, hub);
        //});
    }
    else {
        if (tutorialStep === 3) {
            tutorialplay = play;
            tutorialhub = hub;

            var displacement = -( 0.95 * ($('#quiz_box').outerHeight(true) - $('#TopBar').outerHeight(true)));
            teach($("#quiz_box"), displacement, 0, tutorialStep);
        }
        if (tutorialStep > 5) {
            // raise the answer divs above the backing (so they're the only thing on the screen the user can click)
            $('.answers').css({
                'z-index': 1000,
                'position': 'relative',
            });
            startTime = IREP.getTimestamp();
            answerStartTime = startTime;
            //hub.server.updateQuizStartTimer(paxUid, play).done(function (data) {
                timer(play, hub);
            //});
        }
    }
};



function timer(play, hub) {

    var start = new Date();
    var timeoutVal = Math.floor(maxTime /200);

    animateUpdate();

    function updateProgress(percentage, seconds) {
        $('#countdown').css("width", percentage + "%");

        secondsLeft = (Math.floor((60000 - seconds)) > 9) ? ( Math.floor((60000 - seconds))) :  Math.floor((60000 - seconds));
        
        console.log(secondsLeft);
            if (secondsLeft>=0)
            {
                    $('#quiz_box #TopBar #timer span').html(':'+(Math.round(secondsLeft/1000)));
            }
        if (isTutorialOn ){
            for (var i=0; i<5; i++) {
                if (seconds > (i+1) * 12000) {
                    $('#rightside div').eq(i).addClass('answered');
                }
            }
        }
    }

    function animateUpdate() {
        var now = new Date();
        var timeDiff = now.getTime() - start.getTime();
        var perc = Math.round((timeDiff / maxTime) * 100);
        if (perc <= 99 && stopcount) {
            updateProgress(perc, timeDiff);
            setTimeout(animateUpdate, timeoutVal);
        } else if (stopcount) {
                stopcount = false;
                $("#loader").show();
                $(".question").hide();
                hub.server.postPlay(IREP.user().currentUID, play, answers).done(function (data) {
                    data.Result.Seconds = maxTime - secondsLeft;
                    quizcompleted(hub, IREP.user().currentUID, data);
                });
            return;
        }
    }
}




;
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
}

var isPrc = window.location.origin == 'retailedgecn.intel.com';

var paxUid = getQueryVariable('paxuid');
var authDeferred = null;

if(paxUid==undefined)
{
    window.location.href= window.location.origin +"/50/asmo/edgearena";
}

/*IREP object will be predefined from the app. */
var IREP = {

    options: {
        httpApi: window.location.origin + '/api',
        httpsApi: window.location.origin + '/api'
    },
    user: function () {
        return {
            currentUID: paxUid
        };
    },
    callApi: function (options) {
        options = $.extend({}, {
            type: 'GET',
            secure: false,
            anonymous: false,
            data: {},
            headers: {}
        }, options);
        var headers = $.extend({}, {
            "PaxUID": options.anonymous ? '' : IREP.user().currentUID
        }, options.headers);

        var xhr = $.ajax({
            dataType: "json",
            url: options.secure ? this.options.httpsApi + options.url : this.options.httpApi + options.url,
            contentType: 'application/json',
            type: options.type,
            headers: headers,
            data: options.type === "GET" ? options.data : JSON.stringify(options.data)
        });
        return xhr.promise();
    },
    getTimestamp: function () {
        if (window.performance && window.performance.now) {
            return window.performance.now();
        } else {
            if (window.performance && window.performance.webkitNow) {
                return window.performance.webkitNow();
            } else {
                return new Date().getTime();
            }
        }
    }
};

var localeText = null;
getLocaleText = (function() {
    var localeTextDeferred = null;
    function getLocaleText(localeId) {
        var deferred = $.Deferred();
        if(localeTextDeferred == null) {
            authDeferred.done(function(authResponse) {
                if(localeTextDeferred == null) {
                    localeTextDeferred = IREP.callApi({ url: '/localization/module', data: { code: '201705game-EdgeArenaInGame', cultureCode: authResponse.userData.cultureCode }}).done(function(localeResponse) {
                        localeText = localeResponse.localeText;
                    }).done(function(localeResponse) {
                        IREP.callApi({ url: '/localization/module', data: { code: '201709game-EAUpdatedPromoCopy', cultureCode: authResponse.userData.cultureCode }}).done(function(secondLocaleResponse) {
                            for (var property in secondLocaleResponse.localeText) {
                                if (secondLocaleResponse.localeText.hasOwnProperty(property)) {
                                    localeText[property] = secondLocaleResponse.localeText[property]; 
                                }
                            }
                        }).done(function(){
                            deferred.resolve(localeResponse.localeText[localeId]);
                        });
                    });
                }
            });
        } else {
            localeTextDeferred.done(function(localeResponse) {
                deferred.resolve(localeResponse.localeText[localeId]);
            });
        }
        return deferred.promise();
    }

    return getLocaleText;
}());

loadHtmlLocale = (function() {
    var deferred = $.Deferred();
    $('[data-localeid]').each(function(index, element) {
        var localeId = $(this).data('localeid');
        getLocaleText(localeId).done(function(text) {
            $(element).html(text);
        }).done(function() {
            deferred.resolve();
        });
    });
    return deferred.promise();
});

(function () {

function getPathFromUrl(url) {
    return url.split("?")[0];
}


window.history.pushState('page2', 'Title', getPathFromUrl(window.location.href));

    var pathURLs = [
        "/api/participant/avatar/",
        '/50/signalr/js',
        "/api/participant/avatar/",
    ];

    var userData;
    authDeferred = IREP.callApi({
        url: '/auth/login',
        type: 'POST',
        data: {
            paxuid: paxUid
        }
    }).done(function (data) {

        if (data === undefined)
        {
            window.location.href = window.location.origin +"/50/asmo/edgearena";
            return;
        }
        userData = data.userData;
        $('html').attr('lang', userData.cultureCode);
        $('.PlayerName').html(userData.firstName + ' ' + userData.lastName);
        $('.playeravatar').attr("src",  pathURLs[0]   + userData.publicUID)

        IREP.callApi({ type: "POST", url: '/tracker', data: { code: "EdgeArena", type: "Launch", label: ""  } }); 
        
        var style = document.createElement("link");
            style.setAttribute("type", "text/css");
            style.setAttribute("rel", "stylesheet");
            style.setAttribute("id", "Updated-CSS-In-Lang");
            style.setAttribute("href", "css/fonts_" + userData.cultureCode + ".css?v=");
        jQuery("head")[0].appendChild(style); 

        loadHtmlLocale().done(function() {

        if (!window.frameElement) {
            $.getScript( "//"+ window.location.host + pathURLs[1].replace("stg","prod"), function () {

                if(window.location.host == "retailedge.intel.com") {
                    $.connection.hub.url = "https://retailedge-prod.intel.com/50/signalr";
                } 

                var hub = $.connection.triviaGameHub;

                hub.client.connected = function (id, date) {};
                hub.client.disconnected = function (id, date) {};

                $.connection.hub.qs = {
                    paxuid: paxUid
                };

                $.connection.hub.start().done(function () {
                    initialize(hub, paxUid);
                });
            });
        }

        });

    });
}());

//declare & initialize globals
var readyToRender = {
    'isUserDataReady' : false,
    'isOpponentDataReady' : false,
    'isBadgeDataReady' : false,
    'isChallengerDataReady' : false,
    'removeChallengerData' : false,
    'isQuizReady' : false,
    'isQuizComplete' : false,
    'removePostQuizChallengerData' : false,
    'isLocaleTextReady' : false,
    'isMatchWon' : true,
};
var badgeProgressRepo = [];
var badges;
var isMobile = ($(window).width() >= 800) ? false : true;
var isTutorialOn;
var isTutorialAllowed = true;
var tutorialStep = 0;
var hideBadges = false;
var playsLeft = 0;
var numberOfTutorialUsers = 3;
var startingTutorialUserIndex = 3;

function initialize(hub, paxUid) {

    for (var i=1; i <= numberOfTutorialUsers; ++i) {
        $('#User' + i).addClass('tutorialUser');
    }

    if ($('html').attr('lang') === 'de-DE') {
        $('.badge-progression-text').html('Fortschritt');
    }

    if (isPrc) {
        $('.separator').css('display', 'none');
        $('.match-player-flag').css('opacity', 0);
        $('.ChallengerFlag').css('opacity', 0);
        $('.PlayerCountry').css('opacity', 0);
        $('.OpponentMatchupCountry').css('opacity', 0);
        $('.PublicLocation').css('display', 'none');
    }

    hub.server.getUser(paxUid).done(function (data) {

        // load straight to how to play if the user hasn't played 4 matches.
        isTutorialOn = (data.user.Wins + data.user.Losses < numberOfTutorialUsers);
        //isTutorialOn = true;                              //Testing:
 
        if (isTutorialOn && isTutorialAllowed) {
            tutorialStep = 99;
        }
        else {
            tutorialStep = 13;
            isTutorialOn = false;
        }

        playsLeft = data.plays;
        setUserData(data);
        getOpponents(hub, paxUid);
        getBadges(hub, paxUid);

        checkTutorialState();
    });

    $('.SkipTutorial').click(function () { 
        skipTutorial(hub, paxUid);
    });
}

function setUserData(userData) {
    readyToRender.isUserDataReady = false;
    playsLeft = userData.plays;
    var totalPlays = userData.user.Wins + userData.user.Losses;
    var percent = (userData.user.Wins * 100 / totalPlays) + 1;
    $('.PlayerCountry').html(userData.user.PublicLocation);
    $('.Plays').html(totalPlays);
    $('.PlayerWins').html(userData.user.Wins);
    $('.PlayerLosses').html(userData.user.Losses);
    $('.winsvslosses .PlayerWins').css('width', percent + '%');
    $('.Rating').html(userData.user.Score);
    $('.PlaysAvailable').data("plays", userData.plays);
    $('.PlaysAvailable').html(localeText[185340].replace("[X]", userData.plays));
    readyToRender.isUserDataReady = true;
}

function getOpponents(hub, paxUid) {
    readyToRender.isOpponentDataReady = false;
    var getOpponentData;
    if (!isTutorialOn) {
        getOpponentData = hub.server.getOpponents(paxUid);
    } else {
        getOpponentData = hub.server.getTutorialUsers(paxUid);
    }
    getOpponentData.done(function (users) {
        setOpponentData(users);
    }).done(function () {
        readyToRender.isOpponentDataReady = true;
        render();
    });

    function setOpponentData(users) {

        $('.Player').css('opacity', 1);
        for (var i=9; i>users.length; i--) {
            $('#User' + i).css('opacity', 0);
        }

        $(users).each(function (index) {
            var user = $(this)[0];

            var img =  pathURLs[2]  + user.Avatar;
            var currentdiv = $("#User" + (index + 1));

            currentdiv.data("User", user);
            currentdiv.find(".Avatar").html(user.Avatar);
            currentdiv.find(".Image>img").attr("src", img);
            currentdiv.find(".PublicName").html(user.PublicName);
            currentdiv.find(".PublicLocation").html(user.PublicLocation);
            currentdiv.find(".Score").html(user.Score);
            currentdiv.find(".Wins").html(user.Wins);
            currentdiv.find(".usercountryimage").attr("src", (!isPrc) ? 'images/countries/' + user.CountryName.replace(/ /g, '') + '.png' : '');
        });
        clickPlayer(hub, paxUid);
    }
}

function clickPlayer(hub, paxUid) {

    $('.Player').click(function () {
        if (playsLeft <= 0) {
            $('#startgame').css('background-color', 'rgba(134, 134, 134, .2)');
            $('#startgame').find('div').css('color', 'rgba(255, 255, 255, .2)');
            $('#startgame').off();
            noPlaysLeft();
            return;
        }

        checkTutorialState();

        readyToRender.isChallengerDataReady = false;

        //clear previously selected
        $('.Player').removeClass('SelectedOpponent');

        //populateOpponent
        var user = $(this).data('User');
        img = pathURLs[2] + user.Avatar;
        $('.challengeravatar').attr('src', img);
        $('.OpponentMatchupName').html(user.PublicName);
        $('.OpponentMatchupCountry').html(user.PublicLocation);

        $('#OpponentWins').html(user.Wins);
        $('#OpponentPlays').html(user.Wins + user.Losses);
        $('#OpponentRating').html(user.Score);
        $('#OpponentRating').attr('src', user.Score);
        $('.OpponentMatchupFlag').attr('src', (!isPrc) ? 'images/countries/' + user.CountryName.replace(/ /g, '') + '.png' : '');
        $('.topsummary').addClass('light-highlight');
        $('.botsummary').addClass('dark-highlight');
        $('.match-player-mid-content').addClass('pregame');
        $('.winner').removeClass('winner');
        $(this).addClass('SelectedOpponent');

        $('#startgame').off();
        $('#startgame').one('click', function () {
            if (playsLeft > 0) {
                if (isTutorialOn) {
                    $('.SelectedOpponent .tutorial-check').show(2000);
                    $('.SelectedOpponent').removeClass('tutorialUser1000').removeClass('tutorialUser').css('z-index', 0);
                    $('.selectedTutorialUser').removeClass('selectedTutorialUser');
                }
                $('.Player').removeClass('SelectedOpponent');
                initiateQuiz(hub, paxUid, user);
            }
        });

        $('#cancel-gameplay').one('click', function () {
            $('#startgame').unbind();
            $('.Player').removeClass('SelectedOpponent');
            readyToRender.removeChallengerData = true;
            render();
        });
        readyToRender.isChallengerDataReady = true;
        render();
    });
}

function getBadges(hub, paxUid) {

    readyToRender.isBadgeDataReady = false;
    badgeProgressRepo = [];

    hub.server.getBadges(paxUid).done(function (data) {
        // clear content about to be populated
        $('#recent-badges').find('div').remove();
        $('#badge-wrapper').html("");

        // process each badge
        for (var x = 0; x < data[0].Badges.length; x++) {
            createBadgeDiv(data[0].Badges[x], "badge-wrapper");
            populateRecentBadges(data[0].Badges[x]);
            populateMatchBadges(data[0].Badges[x]);
        }
        winnowMatchBadges(data[0].Badges);
        attachBadgeEvents();

        // store badges
        badges = data[0].Badges;

        function createBadgeDiv(badge, targetId) {
            var elem = $('<div class="' + targetId + '-badge badge"></div>');
            elem.data(badge);
            var imgTag = (badge.Earned || targetId === 'match-badge-wrapper') ? $('<img src="' + badge.ColorImageURL + '"/>') : $('<img src="' + badge.GrayscaleImageURL + '"/>');
            elem.append(imgTag);

            // do this for standard badges, not for recent badges
            if (targetId === "badge-wrapper" || targetId === "match-badge-wrapper") {
                var progressBar = $('<div class="Progress"></div>');
                var barColor = $('<div class="barcolor"></div>');
                var rankNumber = ((targetId === "badge-wrapper" && badge.Earned) || (targetId === "match-badge-wrapper" && badge.BadgeProgressPercent >= 100)) ? $('<div class="ranknumber" style="display: block;"><div>' + badge.LevelNumber + '</div></div>') : $('<div class="ranknumber" style="display: none;"><div></div></div>');
                barColor.css({
                    'width': ((badge.BadgeProgressPercent <= 100) ? badge.BadgeProgressPercent : 100) + '%'
                });
                progressBar.append(barColor);
                elem.append(progressBar).append(rankNumber);
            }

            if (targetId === "badge-wrapper" || targetId === "match-badge-wrapper") {
                var footer = $('<div class="match-badge-footer"></div>');
                var progress = $('<div class="numeric-badge-progress">' + badge.badgewallprogress + '&nbsp;/</div>');
                var total = $('<div class="numeric-badge-total">&nbsp;' + badge.BadgeTotal + '</div>');
                footer.append(progress).append(total);
                elem.append(footer);
            }
            if  (targetId === "recent-badges") {
                elem.prop('id', Date.parse(badge.EarnedDate));
            }

            $('#' + targetId).append(elem);
        }
        function populateRecentBadges(badge) {

            if (badge.Earned) {
                createBadgeDiv(badge, 'recent-badges');

                // shows only the most recent 4 badges (winnow if there's ever a fifth)
                if ($('#recent-badges').find('.badge').length === 5) {

                    var earnedDates = [];
                    $('#recent-badges').find('div').each(function(){
                        earnedDates.push(parseInt($(this).prop('id'), 10));
                    });

                    Array.min = function( array ){
                        return Math.min.apply( Math, array );
                    };

                    $('#' + Array.min(earnedDates)).remove();
                }
            }
        }
        function populateMatchBadges(badge) {
            if (badges !== undefined) {

                //FOR TESTING: ADD RANDOM AMOUNT TO EACH BADGE DURING A MATCH
//                var random = Math.random() * 20;
//                badge.BadgeProgressPercent += random;

                for (var i = 0; i < badges.length; ++i) {
                    if (badge.Code === badges[i].Code) {
                        if (badge.LevelNumber > badges[i].LevelNumber || badge.BadgeProgressPercent > badges[i].BadgeProgressPercent) {
                            badgeProgressRepo.push({
                                progress: (badge.LevelNumber > badges[i].LevelNumber) ? 100 : (badge.BadgeProgressPercent - badges[i].BadgeProgressPercent),
                                code: badge.Code
                            });
                            // only need to filter if there are more than 3 badges
                            if (badgeProgressRepo.length > 3) {

                                badgeProgressRepo.sort(function (a, b) {
                                    return parseFloat(b.progress) - parseFloat(a.progress);
                                });
                            }
                        }
                    }
                }
            }
        }
        function winnowMatchBadges(badgeSet) {
            $('#match-badge-wrapper').html("");
            if (badgeProgressRepo.length) {
                //get the [i]th Code from the repo, match it to the code in the badgeset, create div
                for (var i = 0; i < (badgeProgressRepo.length > 3 ? 3: badgeProgressRepo.length); ++i) {
                    for (var j = 0; j < badgeSet.length; ++j) {
                        if (badgeProgressRepo[i].code === badgeSet[j].Code) {
                            // create the badge & add it to the div
                            createBadgeDiv(badgeSet[j], 'match-badge-wrapper');
                        }
                    }
                }
            }
        }
    }).done(function () {
        readyToRender.isBadgeDataReady = true;
        render();
    });
}

$('#show-badges-button').click(function() {
    $('#show-badges-button').hide();
    $('#dashboard, #badge-progress').show();
});

$('#badge-progress-header').click(function() {
    if (isMobile) {
        $('#show-badges-button').show();
        $('#dashboard, #badge-progress').hide();
        $('#recent-badges').hide();
    }
});


//  --------------------------------------------------    PLAY    --------------------------------------------------    //
function initiateQuiz(hub, paxUid, user) {
    $answerblock = $('#leftside div:first');
    $answerblockright = $('#rightside div:first');
    $('.answered').removeClass('answered');
    $(".Player").unbind();
    $("#loader").css({'height': $('html').css('height')}).fadeIn(500);

    hub.server.initiateQuiz(paxUid, user.Avatar, user.PlayerType,isMobile,navigator.userAgent).done(function (data) {

        console.log(data);
        if(data.QuestionPoolId ==0)
        {$("#loader").fadeOut(500);
            noPlaysLeft();
        }
        else{
            
    readyToRender.isQuizReady = true;
    render();

            setTimeout(function () {
                startQuiz(data, hub);

                if (!isTutorialOn) {

                    var opponentanswers = data.Pool.Answers;
                    for (var x = 0; x < opponentanswers.length; x++) {

                        setTimeout(function () {
                            $answerblockright.addClass('answered');
                            $answerblockright = $answerblockright.next().next();

                        }, opponentanswers[x].MiliSeconds);
                    }
                }
                else {
                    $('#backing').css({
                        'z-index': 999
                    });
                }
            }, 500);
            
        }
    });
}

function quizcompleted(hub, paxUid, qcdata) {
    readyToRender.isQuizComplete = false;

    hub.server.getUser(paxUid).done(function (data) {

        setTimeout(function () {
            answers = [];

            stopcount = false;
            $('.question').remove();
            $('.answers').remove();
            $('.match-player-mid-content').removeClass('pregame');
            $('.correct').html(localeText[185337].replace('[X/X]', '' + qcdata.Result.Correct + '/5').replace('[time]', (qcdata.Result.Seconds/1000).toFixed(2)));
            $('#opponentinfo').find('.correct').html(localeText[185337].replace('[X/X]', '' + qcdata.Result.OpponentCorrect + '/5').replace('[time]', (qcdata.Result.OpponentSeconds/1000).toFixed(2)));

            var perfectScore = (qcdata.Result.Correct === 5) ? true : false;
            randomFinishText(qcdata.Result.Win, perfectScore);

            if (qcdata.Result.Win) {
                readyToRender.isMatchWon = true;
                $('.pointschange').html('+' + qcdata.Result.ScoreChange);
                $('.won').css('display', 'block');
                $('.lost').css('display', 'none');
                $('.topsummary').removeClass('light-highlight');
                $('.botsummary').removeClass('dark-highlight');
            } else {
                readyToRender.isMatchWon = false;
                $('.pointschange').html(qcdata.Result.ScoreChange);
                $('.won').css('display', 'none');
                $('.lost').css('display', 'block');
                $('#opponentinfo > .topsummary').addClass('light-highlight');
                $('#opponentinfo > .botsummary').addClass('dark-highlight');
            }

            $('#donereview').one('click', function () {
                checkTutorialState(); // tutorialStep = 5
                readyToRender.removePostQuizChallengerData = true;
                render();
                if (playsLeft <= 0) {
                    
                    noPlaysLeft();
                }
            });
            checkTutorialState(); //tutorialStep = 4

        }, 2000);

        if (isTutorialOn && $('.tutorialUser').length === 0) {
            isTutorialOn = false;
            endTutorialMode();
        }

        setTimeout(function() {
        readyToRender.isQuizComplete = true;
            setUserData(data);
            getOpponents(hub, paxUid);
            getBadges(hub, paxUid);
        }, 250);

        checkTutorialState(); //tutorialStep = 6

    });

}

function randomFinishText(matchWasWon, perfect) {

    var winMessage = [185328, 185324, 185325, 185326,  185327, 185329];
    var lossMessage = [185331, 185332, 185333, 185334];

    var message = "";
    var index;
    if (matchWasWon) {
        if (perfect) {
           message = localeText[winMessage[0]] + " " + " ";
        }

        index = ((Math.random() * (winMessage.length - 1)) | 0 ) + 1;
        message += localeText[winMessage[index]];
    }
    else {
        index = Math.random() * lossMessage.length | 0;
        message = localeText[lossMessage[index]];
    }
    $('.match-end-message').html(message);
}

$('.exit').off().on('click', function(){
    $('#loadmessage').html('');
    $('#loader').fadeIn(250, function() {
        $('#container').hide(0);
        if(isMobile) {
            if (!isPrc) {
                window.location.href='https://retailedge.intel.com/mobile/#/cms/route/testlist?ctrlId=6051';
            }
            else {
                window.location.href='https://retailedgecn.intel.com/mobile/#/cms/route/testlist?ctrlId=6051';
            }
        }
        else {
            if (!isPrc) {
                window.location.href="https://retailedge.intel.com/games/edgearena/index.html";
            }
            else {
                window.location.href="https://retailedgecn.intel.com/games/edgearena/index.html";
            }
        }
    });
});

//  --------------------------------------------------    RENDER  --------------------------------------------------    //
function render() {

    if (readyToRender.isUserDataReady && readyToRender.isOpponentDataReady && readyToRender.isBadgeDataReady && !readyToRender.isQuizComplete) {

        if (isMobile) {
            $('#player-header').hide(0);
        }
        else {
            $('#mobile-header').hide(0);
        }
        $('#info, #dashboard, #challenge, #quiz_box').hide(0);
        $('#dashboard-wrapper, #recent-badges, #badge-progress, #match-badge-progress').hide(0);
        $('#show-badges-button').hide(0);
        $('.Player, .badge').hide(0);
        $('.quizsummary, .quiz, #quiz_matchup').hide(0);

        loadHtmlLocale();
        processLanguageExceptions();

        $('#loadmessage').html('<span>' + localeText[185302] + '</span>');

        $("#loader").fadeOut(500, function () {

            // standard gameplay
            if (!isTutorialOn) {

                $('#container').fadeIn(500, function () {
                    if (isMobile) {
                        $('#mobile-player-widget-wrapper').css('height', parseInt($('#mobile-player-widget-bottomhalf').css('height')) + 15 + 'px');
                        $('#mobile-header').fadeIn(500, function () {
                            countUpNumbers($('#mobile-header'));
                            $('#show-badges-button').show(500);
                        });
                        $('#dashboard-wrapper').show(0);
                        $('.badge').each(function (index) {
                            $this = $(this);
                            $this.show(0);
                        });
                    }
                    else {
                        $('#player-header-wrapper').css('height', $('#player-header-bottomhalf').css('height'));
                        $('#player-header').fadeIn(500, function () {
                            countUpNumbers($('#player-header'));

                        });
                        $('#dashboard-wrapper').show(0);
                        $('#badge-progress').show(0);
                        $('.badge').each(function (index) {
                            $this = $(this);
                                $this.show(0);

                                var badgeProgressBarWidth = parseInt($this.find('.barcolor').css('width'));
                                $this.find('.barcolor').css('width', 0);
                                $this.find('.barcolor').animate({
                                    'width': badgeProgressBarWidth + '%'
                                }, 1500);
                        });
                        if ($('#recent-badges .badge').length === 4) {
                            $('#recent-badges').show(0);
                        }
                        $('#dashboard').fadeIn(500);
                    }
                    $('#challenge').show(500, function () {
                        $('#headingbar').show(300);
                        for (var i=1; i<=$('.Player').length; ++i) {
                            $('#User' + i).show(400 + (i * 100));
                        }
                    });
                });
            }
            else {  // tutorialMode
                $('#show-badges-button').hide();
                $('#StartTutorial').css({
                    'z-index':1000,
                    'position': 'relative'
                });
                $('#container').fadeIn(500, function () {

                    if (isMobile) {
                        $('#mobile-player-widget-wrapper').css('height', parseInt($('#mobile-player-widget-bottomhalf').css('height')) + 15 + 'px');
                        if (tutorialStep !== 99) {
                            $('#mobile-header').fadeIn(500, function () {
                                countUpNumbers($('#mobile-header'));
                            });
                            $('#dashboard').show();
                            $('#challenge').fadeIn(500, function () {
                                $('#headingbar').show(300);
                                for (var i=1; i <= numberOfTutorialUsers; ++i) {
                                    $('#User' + i).show(400 + (i * 100));
                                }
                            });
                        }
                        else {
                            $('#info').find('.wrapper').css({
                                'position': 'relative',
                                'z-index': 1000
                            });
                            $('#info').fadeIn(500);
                        }
                    }
                    else {
                        $('#player-header-wrapper').css('height', $('#player-header-bottomhalf').css('height'));
                        $('#player-header').fadeIn(500, function () {
                            countUpNumbers($('#player-header'));
                        });
                        $('#dashboard').show();
                        $('#backing').css('display', 'block');
                        $('#info').fadeIn(500);
                        $('#challenge').fadeIn(500, function () {
                            $('#headingbar').show(300);
                            for (var i=1; i <= numberOfTutorialUsers; ++i) {
                                $('#User' + i).show(400 + (i * 100));
                            }
                        });
                    }
                });
            }

        });
        readyToRender.isUserDataReady = false;
        readyToRender.isBadgeDataReady = false;
        readyToRender.isOpponentDataReady = false;
    }

    if (readyToRender.isChallengerDataReady) {
        $('.nonquiz').hide();
        $('#quiz_matchup').fadeIn(500);
        $('.quizmatchup').fadeIn(500);
        if (isMobile) {
            $('#dashboard').show();
            $('#challenge').hide();
            $('.spacer').hide();
        }
        else {
            $('.spacer').show();
        }

        if (!isTutorialOn) {
            location.href = '#body';
        }

        readyToRender.isChallengerDataReady = false;
    }

    if (readyToRender.removeChallengerData) {
        $('.quizmatchup').hide();
        $('.quizsummary').hide();
        $('#dashboard-wrapper').show(0, function () {
            $('#dashboard-wrapper').fadeIn(500, function () {
                if (!isTutorialOn) {
                    $('#badge-progress').show(0);
                    $('#badge-wrapper').show(0);
                    if ($('#recent-badges .badge').length === 4) {
                        $('#recent-badges .badge').show(0);
                    }
                }
            });
        });
        if (isMobile) {
            $('.nonquiz').show();
            $('#dashboard').hide();
            $('#badge-progress').hide();
            $('#recent-badges').hide();
            $('#challenge').fadeIn(500);
        }
        $('#quiz_matchup').hide();
        readyToRender.removeChallengerData = false;
    }

    if (readyToRender.isQuizReady) {
        $("#container").fadeOut(500, function() {
            $(".quiz").fadeIn(1000, function() {
                $("#loader").fadeOut(500);
            });
        });
        if (isTutorialOn) {
            $('#info').hide();
        }
        readyToRender.isQuizReady = false;
    }

    if (readyToRender.isQuizComplete && readyToRender.isUserDataReady && readyToRender.isOpponentDataReady && readyToRender.isBadgeDataReady) {
        $("#loader").fadeOut(1000, function(){
            

            $(".quizsummary").show(0);
            $(".quizmatchup").hide(0);
            $('#quiz_box').hide(0);
            $("#container").fadeIn(500, function() {

                if ($('#match-badge-wrapper .badge').length && !isTutorialOn && !hideBadges) {
                    $('#match-badge-progress').show(0);
                    $('#match-badge-wrapper').show(0, function(){
                        $('.match-badge-wrapper-badge').each(function (index) {
                            $this = $(this);

                                var badgeProgressBarWidth = parseInt($this.find('.barcolor').css('width'));
                                $this.find('.barcolor').css('width', 0);
                                $this.find('.barcolor').animate({
                                    'width': badgeProgressBarWidth + '%'
                                }, 1500);
                        });
                    });
                }
                else {
                    $('#match-badge-progress, #match-badge-wrapper').hide(0);
                }

            });

            if (isTutorialOn) {
                $('#info').hide();
            }
            else {
                for (var i=1; i<=$('.Player').length; ++i) {
                    $('#User' + i).show(400 + (i * 100));
                }
            }
            if (hideBadges) {
                hideBadges = false;
            }
        });
        readyToRender.isQuizComplete = false;
    }

    if (readyToRender.removePostQuizChallengerData) {
        $('#quiz_matchup').hide();
        if (!isTutorialOn) {
            if (isMobile) {
                $('#show-badges-button').show();
            }
            else {
                $('#badge-progress').show();
                if ($('#recent-badges').length === 4) {
                    $('#recent-badges').show();
                }
            }
        }
        else {
            $('#info').hide();
        }
        $('#dashboard-wrapper').show(0);
        readyToRender.removePostQuizChallengerData = false;
    }
    setTimeout (function() {
        $('#shade').css('height', $('html').css('height'));
        $('#backing').css('height', $('html').css('height'));
        $('body').focus();
    }, 1000);

    function countUpNumbers(div) {
        $(div).find('.Rating, .Plays, .PlayerWins, .PlayerLosses').each(function () {
            var $this = $(this);
            var destination = parseInt($this.html());
            $this.html(0);
            jQuery({
                Counter: $this.html()
            }).animate({
                Counter: destination
            }, {
                    duration: 2000,
                    easing: 'swing',
                    step: function () {
                        $this.text(Math.ceil(this.Counter));
                    }
                });
        });
    }
}





//  --------------------------------------------------    TUTORIAL    --------------------------------------------------    //

$('#StartTutorial').click(function () {
    $("#info").hide();
    tutorialStep = 1;
    if (isMobile) {
        readyToRender.isUserDataReady = true;
        readyToRender.isOpponentDataReady = true;
        readyToRender.isBadgeDataReady = true;
        render();
    }
    checkTutorialState(); // tutorialStep = 1
});

function checkTutorialState() {

    switch (tutorialStep) {
    case -1:
        return;
    case 0:
        tutorialStep = 1;
        return;
    case 1:
        teach($('#dashboard'), 0, 0, tutorialStep);
        break;
    case 2:
        teach($('#quiz_matchup'), -391, 0, tutorialStep);
        break;
    case 3:
        break;
    case 4:
        teach($('#quiz_matchup'), -367, 0, tutorialStep);
        break;
    case 5:
        teach($('#dashboard'), 0, 0, tutorialStep);
        break;
    case 6:
        if (isTutorialOn) {
            $('#backing').css({
                'display': 'block',
                'height': ($('html').css('height')),
            });
            $('#info').remove();
        }
        break;
    case 7:
        break;
    case 13:
        $('.tutorialUser').removeClass('tutorialUser');
        tutorialStep = -1;
        break;
    default:
        break;
    }
}

function teach(elem, top, left, messageContentIndex) {

    $("#shade").css({
        'display': 'block',
        'opacity': 0.6,
        'height': ($('html').css('height'))
    }).fadeIn(300, function () {

        $('#tutorialheader span').html(localeText[tutorialHeader[messageContentIndex - 1]]);
        $('#tutorialcontent #messageContent').html(localeText[tutorial[messageContentIndex - 1]]);
        $('#tutorialheader').css("z-index", 9999);
        $('#tutorialclose').css("z-index", 9999);
        $('#tutorialclose img')
            .addClass("animated bounceIn")
            .addClass("animated infinite")
            .css({
                'animation-duration': '2.5s',
                'z-index': 9999
            });

        var tm = $('#tutorialmessage');

        $('#backing').css({
            'display': 'block',
            'height': ($('html').css('height'))
        });
        elem.css("position", "relative");
        tm.css({
            'opacity': 1,
            'z-index': 9999,
            'top': top,
            'left': left,
            'display': 'block',
        });
        if (left === 0) {
            tm.css({'margin': 'auto'});
        }

        elem.append(tm);

        switch (tutorialStep) {
        case 1:

            //raise the tutorial opponents above the backing
            for (var i = 1; i <= numberOfTutorialUsers; i++) {
                $('#User' + i).addClass('tutorialUser891');
            }
            // highlight the 3rd
            $('#User' + startingTutorialUserIndex).addClass('SelectedOpponent');
            break;

        case 3:
            // move the timer bar slightly forward (to highlight that it changes)
            $('#countdown').css("width", 10 + "%");

            // dim the user divs previously raised in Step 1
            for (var i = 1; i <= numberOfTutorialUsers; i++) {
                $('#User' + i).addClass('tutorialUser0');
            }
            break;

        case 5:
            //raise the tutorial opponents (less the already played one) above the backing
            for (var i = 1; i <= numberOfTutorialUsers; i++) {
                if (i !== startingTutorialUserIndex) {
                    $('#User' + i).addClass('tutorialUser891').removeClass('tutorialUser0');
                }
            }
            break;
        }
        if ($("#shade").css('display') !== 'none') {
            $("#shade").css({
                'height': ($('html').css('height'))
            });
        }
        if ($("#backing").css('display') !== 'none') {
            $('#backing').css({
                'height': ($('html').css('height'))
            });
        }
    });
}

var tutorial = [185310, 185312, 185314, 185316, 185318];
var tutorialHeader = [185309, 185311, 185313, 185315, 185317];

$('#tutorialclose').click(function () {
    $('#exit').css('border-radius', '0 10px 10px 0');

    switch (tutorialStep) {
        case -1:
            $('#backing').css('display', 'none');
            unshade();
            return;
        case 1:
            $('#User' + startingTutorialUserIndex).addClass('tutorialUser1000').removeClass('tutorialUser891');
            $('#User' + startingTutorialUserIndex + ' ' + '.PlayerInfo')
                .addClass("animated bounceIn")
                .addClass("animated infinite")
                .css({
                    'animation-duration': '2.5s',
                });
            $('#User' + startingTutorialUserIndex).click(function () {
                $('#User' + startingTutorialUserIndex + ' ' + '.PlayerInfo').removeClass("animated bounceIn");
                $('#User' + startingTutorialUserIndex + ' ' + '.PlayerInfo').removeClass("animated infinite");
                $('#User' + startingTutorialUserIndex + ' ' + '.PlayerInfo').css({
                    'animation-duration': '1s'
                });
            });

            $('#backing').css({
                'background-color': 'rgba(0, 0, 0, 0)',
                'height': ($('html').css('height'))
            });
            $("#shade").css({
                'display': 'block',
                'opacity': 0.4,
                'height': ($('html').css('height'))
                });
            hideMessage();
            break;

        case 2:
            unshade();
            $('#User' + startingTutorialUserIndex)
                .addClass('tutorialUser0')
                .removeClass('tutorialUser1000')
                .removeClass('SelectedOpponent');

            $('#startgame').css({
                'z-index': 1000,
                'position': 'relative',
            });
            $('#startgame div')
                .addClass("animated bounceIn")
                .addClass("animated infinite")
                .css({
                    'animation-duration': '2.5s'
            });
            $('#startgame').click(function(){
                $('#startgame div').removeClass("animated bounceIn");
                $('#startgame div').removeClass("animated infinite");
            });

            break;

        case 3:
            $('#shade').css("opacity", 0);
            hideMessage();
            $('.answers').css({
                'z-index': 1000,
                'position': 'relative',
            });
                timer(tutorialplay, tutorialhub);
            break;

        case 4:
            unshade();
            $('#donereview').css({
                'z-index': 1000,
                'position': 'relative',
            });
            $('#backing').css({
                'background-color': 'rgba(0, 0, 0, 0)',
                'height': ($('html').css('height'))
            });
            $('#donereview div')
                .addClass("animated bounceIn")
                .addClass("animated infinite")
                .css({
                    'animation-duration': '2.5s'
            });
            $('#donereview').click(function(){
                $('#donereview div').removeClass("animated bounceIn");
                $('#donereview div').removeClass("animated infinite");
            });

            break;

        case 5:
            // don't unshade; copy step 1
            $('#backing').css({
                'background-color': 'rgba(0, 0, 0, 0)',
                'height': ($('html').css('height'))
            });
            $("#shade").css({
                'display': 'block',
                'opacity': 0.4,
                'height': ($('html').css('height'))
            });
            hideMessage();

            // raise the unplayed opponents above the div
            for (var i = 1; i <= numberOfTutorialUsers; i++) {
                if (i !== startingTutorialUserIndex) {
                    $('#User' + i).addClass('tutorialUser1000').removeClass('tutorialUser891');
                }
            }
           break;
    }
    tutorialStep++;
    if (playsLeft <= 0) {
        $('#backing').hide();
        $('#shade').hide();
    }
});

function unshade() {
    $('#shade').css("opacity", 0).fadeOut(300, function () {
        hideMessage();
    });
}

function hideMessage() {
    $('#tutorialmessage').css({
        'opacity': 0,
        'z-index': -1,
    });
    $('#tutorialheader').css("z-index", -1);
    $('#tutorialclose').css("z-index", -1);
    $('#tutorialmessage').css("display", "none");
}

$('.tutorialUser1000').click(function() {
    $('.selectedTutorialUser').addClass('tutorialUser1000').removeClass('selectedTutorialUser');
    $(this).addClass('SelectedOpponent').addClass('selectedTutorialUser').removeClass('tutorialUser1000');
});

function endTutorialMode() {
    if ($('.tutorialUser1000').length === 0) {

        $('.tutorial-check').remove();

        // stop x animations
        $('#tutorialclose img').removeClass("animated bounceIn");
        $('#tutorialclose img').removeClass("animated infinite");
        $('div').removeClass("animated infinite");

        // reset step 2/3 state
        $('#startgame').css({
            'z-index': 0,
        });

        // reset step 3/4 state
        $('.answers').css({
            'z-index': 0,
        });

        // reset step 4/5 state
        $('#donereview').css({
            'z-index': 0,
        });

        // reset step 5/6 state
        $('#getstarted').css({
            'z-index': 0,
        });

        //drop the backing
        $('#backing').css('display', 'none');
        unshade();

        //lower the exit button
        $('#exit').css('z-index', '0');

        // turn off the tutorial
        hideBadges = true;
        isTutorialOn = false;       ;
    }
}

function skipTutorial(hub, paxUid) {
    isTutorialAllowed = false;
    $('#container').hide();
    console.log('working');
    $('#loader').fadeIn(250, function() {
        $('.Player').removeClass('SelectedOpponent')
                    .removeClass('tutorialUser')
                    .removeClass('tutorialUser891')
                    .removeClass('tutorialUser1000')
                    .removeClass('selectedTutorialUser')
                    .addClass('tutorialUser0');
        endTutorialMode();
        $('.Player').removeClass('tutorialUser0')
        initialize(hub, paxUid);
    });
}


//  --------------------------------------------------    OUT OF PLAYS  --------------------------------------------------    //

function noPlaysLeft() {

    $('#startgame').css('background-color', 'rgba(134, 134, 134, .2)');
                    $('#startgame').find('div').css('color', 'rgba(255, 255, 255, .2)');
                    $('#startgame').off();

    $("#shade").css({
        'display': 'block',
        'opacity': 0.6,
        'height': ($('html').css('height'))
    }).fadeIn(300, function () {
        $('#tutorialheader span').html(localeText[185368]);
        $('#tutorialcontent').html(localeText[187556]);
        $('#tutorialheader').css("z-index", 9999);
        $('#tutorialclose').css("z-index", 9999);

        processLanguageExceptions();
        var tm = $('#tutorialmessage');

        tm.css({
            'opacity': 1,
            'z-index': 9999,
            'top': 100,
            'left': 0,
            'display': 'block',
        });
        $("#backing").prepend(tm);
        $('#backing').css({
            'display': 'block',
            'opacity': 1,
            'height': ($('html').css('height'))
        });
    });
}


//  --------------------------------------------------    BADGE TOOLTIPS   --------------------------------------------------    //

function attachBadgeEvents() {
    var insideTooltip;
    $('body').bind('click','.badge', function(e) {
        e.cancelBubble = true;
        if(e.stopPropagation) {
            e.stopPropagation();
        }
        if (!$(e.target).hasClass('badge-tooltip')) {
            $('.badge-tooltip').remove();        
            var badgeDiv = ($(e.target).hasClass('badge')) ? $(e.target) : ( ($(e.target).parent().hasClass('badge')) ? $(e.target).parent('.badge') : 'non-badge');

            if (badgeDiv !== 'non-badge') {
                getTooltipPosition(badgeDiv);
                createBadgeTooltip(badgeDiv);
                moveBadgeTooltip();
            }
        }
    });
    var pos;
    var midpoint;
    var distance;

    function moveBadgeTooltip() {
        $('.badge-tooltip').css({
            'left': midpoint + distance,
            'top': pos.top,
            'transform': 'translate(-50%, 0)',
        });
    }

    function getTooltipPosition(badgeDiv) {
        pos = badgeDiv.position();
        pos.left += parseInt(badgeDiv.css('width')) / 2;
        //move tooltip down - less for mobile
        pos.top += (isMobile) ? 55 : 70;
        //start at midpoint & send it 1/2 the distance to the badgeDiv's midpoint, then transform: translate(-50%, 0);
        midpoint = parseInt(badgeDiv.parent().css('width')) / 2;
        distance = (pos.left - midpoint) / 2;
    }

    function createBadgeTooltip(badgeDiv) {
        var elem = $('<div></div>');
        elem.addClass('badge-tooltip');
        elem.html('<div class="badge-tooltip-topsection">' +
            '   <div class="badge-tooltip-title">' + badgeDiv.data('Title').slice(localeText[185299].length + 2).replace("160;:", "").replace("Edge Arena:", "").replace("Edge Arena :", "").replace("Edge Arena：", "") + '</div>' +
            '   <div class="badge-tooltip-description">' + badgeDiv.data('Description') + '</div>' +
            '   <div class="badge-tooltip-highest">' + localeText[185466] + '&nbsp;<span>' + badgeDiv.data('BadgeProgress') + '</span></div>' +
            '</div>' +
            '<div class="badge-tooltip-bottomsection">' +
            '   <div class="badge-tooltip-progress">' +
            '       <div class="badge-tooltip-barcolor"></div>' +
            '   <div class="badge-tooltip-bottomtext"><span>' + badgeDiv.data('BadgeProgress') + '</span>/<span class="badge-tooltip-Total">' +  badgeDiv.data('BadgeTotal') + '</span></div>' +
            '</div>'
        );

        badgeDiv.parent().append(elem);

        var descriptionText = $('.badge-tooltip-description').html();
        $('.badge-tooltip-description').html(descriptionText.replace("[X]", badgeDiv.data('BadgeTotal')));
        elem.find('.badge-tooltip-barcolor').animate({
            width: ((badgeDiv.data('BadgeProgressPercent') <= 100) ? badgeDiv.data('BadgeProgressPercent') : 100) + '%'
        }, 500);
        elem.bind('click', function(){
            $('.badge-tooltip').remove();
        });

        return elem;
    }
}


//  --------------------------------------------------    LANGUAGE EXCEPTIONS   --------------------------------------------------    //

function processLanguageExceptions() {

    switch ($('html').attr('lang')) {
        case 'de-DE':
            if (isMobile) {
                $('.badge-progression-text').html('Fortschritt');
                $('#tutorialmessage').css({
                    'width': '90%',
                });
                $('#tutorialheader').css({
                    'padding': '8px 65px 8px 14px',
                });
            }
            break;
        case 'fi-FI':
            if (isMobile) {
                $('.badge-progression-text').css('font-size', '16px');
            }
            break;
        case 'cs-CZ':
            if (isMobile) {
                $('#tutorialmessage').css({
                    'width': '90%',
                });
            }
            break;
        case 'el-GR':
            if (isMobile) {
                $('#tutorialheader').css({
                    'padding': '18px 0 18px 9px',
                    'font-size': '15px'
                });
            }
            break;
        case 'es-ES':
            if (isMobile) {
                $('#tutorialheader').css({
                    'padding': '18px 0 18px 9px',
                    'font-size': '15px'
                });
            }
            break;
        case 'fr-FR':
            if (isMobile) {
                $('#tutorialmessage').css({
                    'width': '90%',
                });
                $('#tutorialheader').css({
                    'padding': '8px 65px 8px 14px',
                });
            }
            break;
        case 'hu-HU':
            if (isMobile) {
                $('#tutorialmessage').css({
                    'width': '90%',
                });
                $('#tutorialheader').css({
                    'padding': '18px 0 18px 9px',
                    'font-size': '15px'
                });
            }
            break;
        case 'id-ID':
            if (isMobile) {
                $('#tutorialheader').css({
                    'padding': '18px 0 18px 9px',
                });
            }
            break;
        case 'ja-JP':
            if (isMobile) {
                $('#tutorialmessage').css({
                    'width': '95%',
                });
                $('#tutorialheader').css({
                    'padding': '18px 40px 18px 8px',
                    'font-size': '14px'
                });
                $('#tutorialclose-wrapper').css({
                    'right': 0,
                });
                $('#tutorialclose').css({
                    'height': '40px',
                    'width': '40px',
                });
                $('#tutorialclose img').css({
                    'height': '15px',
                    'width': '15px',
                    'right': 6,
                    'top': 6,
                });
            }
            break;
        case 'ko-KR':
            if (isMobile) {
                $('#tutorialmessage').css({
                    'width': '96%',
                });
                $('#tutorialheader').css({
                    'padding': '18px 0 18px 9px',
                    'font-size': '14px'
                });
            }
            break;
        case 'nl-NL':
            if (isMobile) {
                $('#tutorialmessage').css({
                    'width': '85%',
                });
                $('#tutorialheader').css({
                    'padding': '18px 0 18px 9px',
                    'font-size': '15px'
                });
            }
            break;
        case 'ro-RO':
            if (isMobile) {
                $('#tutorialmessage').css({
                    'width': '86%',
                });
                $('#tutorialheader').css({
                    'padding': '18px 40px 18px 8px',
                    'font-size': '14px'
                });
                $('#tutorialclose-wrapper').css({
                    'right': 0,
                });
                $('#tutorialclose').css({
                    'height': '40px',
                    'width': '40px',
                });
                $('#tutorialclose img').css({
                    'height': '15px',
                    'width': '15px',
                    'right': 6,
                    'top': 6,
                });
            }
            break;
        case 'sv-SE':
            if (isMobile) {
                $('#tutorialheader').css({
                    'padding': '18px 0 18px 9px',
                });
            }
            break;
        case 'th-TH':
            if (isMobile) {
                $('#tutorialmessage').css({
                    'width': '90%',
                });
                $('#tutorialheader').css({
                    'padding': '18px 0 18px 9px',
                    'font-size': '15px'
                });
            }
        case 'tr-TR':
            if (isMobile) {
                $('#tutorialheader').css({
                    'padding': '18px 0 18px 9px',
                });
            }
            break;
    }
}


var pathURLs = [
    "/api/participant/avatar/",
    '/50/signalr/js',
    "/api/participant/avatar/",
];
