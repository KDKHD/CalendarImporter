const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5001
if (PORT == 5001) {
    urlredirect = 1
} else {
    urlredirect = 2
}
var app = express();
var https = require('https');
var http = require('http');
const fs = require('fs');
const readline = require('readline');
const {
    google
} = require('googleapis');
var request = require('request');
var admin = require('firebase-admin');
var convert = require('xml-js');
var crypto = require('crypto');
var schedule = require('node-schedule');
var testdata = false //test import
cryptoalgorithm = 'aes-256-ctr',
    cryptopassword = [*HASH SALT*];
var processinglist = []
var serviceAccount = require(__dirname + '[*SEVICE ACCOUNT KEY*]');

app.use(require('body-parser').raw({
    type: '*/*'
}));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://kclcal.firebaseio.com'
});


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.profile'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

var importqueue = []


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {

    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[urlredirect]);

    // Check if we have previously stored a token.

    return getAccessToken(oAuth2Client, callback);


}


function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    return [authUrl, oAuth2Client];



}

function getloginurl(event, auth) {
    const calendar = google.calendar({
        version: 'v3',
        auth
    });
    calendar.events.insert({
        auth: auth,
        calendarId: 'primary',
        resource: event,
    }, function(err, event) {
        if (err) {
            console.log('There was an error contacting the Calendar service: ' + err);
            return;
        }
        //console.log('Event created: %s', event.htmlLink);
        console.log("created event " + event)
    });


}

var checker = schedule.scheduleJob('0 0 1-31 1-12 0-6', function() {
    console.log("scheduled import check")
    scheduleimport()
});

//var checker = schedule.scheduleJob('0 0-59 0-23 1-31 1-12 0-6', function(){
//    console.log("scheduled import check")
//    scheduleimport()
//});


function scheduleimport() {
    var ref = admin.database().ref('users');
    ref.once('value')
        .then(function(snapshot) {
            uidlist = snapshot.val()
            for (uid in uidlist) {
                tempuid = uidlist[uid]
                scheduletimerlist = tempuid.schedule
                if (scheduletimerlist != null) {
                    scheduletimerarr = scheduletimerlist.split(',');
                    var d = new Date();
                    var n = d.getDay() - 1
                    dblogger(uid, 'Checking if today is a schedule day')
                    if (scheduletimerarr.includes(n.toString())) {
                        console.log(uid + " Scheduled import started")
                        dblogger(uid, 'Scheduled import started.')

                        var data = {}

                        data.scheduletrigger = true
                        data.noresponse = true
                        var callbacks = []
                        data.uid = uid
                        callbacks.unshift(addeventtocalendar)
                        callbacks.unshift(eventparser)
                        callbacks.unshift(checkifcallendarexists)
                        if (!testdata) {
                            callbacks.unshift(geteventsfromkcl)
                        } else {
                            data.xml = '<ns1:retrieveCalendarResponse xmlns:ns1="http://campusm.gw.com/campusm"><ns1:calendar><ns1:calitem><ns1:desc1>4CCS1DBS DATABASE SYSTEM SEM2 000001/Lecture/01</ns1:desc1><ns1:desc2>Database systems</ns1:desc2><ns1:start>2019-02-28T15:00:00.000+00:00</ns1:start><ns1:end>2019-02-28T17:00:00.000+00:00</ns1:end><ns1:teacherName>Michael, Brendan;Tsoka, Sophia</ns1:teacherName><ns1:locCode>F-WBB.5</ns1:locCode><ns1:locAdd1>WATERLOO FWB B5</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1DBS DATABASE SYSTEM SEM2 000001/Prac/06</ns1:desc1><ns1:desc2>Database Systems</ns1:desc2><ns1:start>2019-02-25T12:00:00.000+00:00</ns1:start><ns1:end>2019-02-25T14:00:00.000+00:00</ns1:end><ns1:locCode>#SPLUS6DAAC1</ns1:locCode><ns1:locAdd1>Bush House (S)7.01/2 (Lab)</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1DBS DATABASE SYSTEM SEM2 000001/Tut/01</ns1:desc1><ns1:desc2>Database Systems</ns1:desc2><ns1:start>2019-02-28T17:00:00.000+00:00</ns1:start><ns1:end>2019-02-28T18:00:00.000+00:00</ns1:end><ns1:teacherName>Michael, Brendan;Tsoka, Sophia</ns1:teacherName><ns1:locCode>F-WBB.5</ns1:locCode><ns1:locAdd1>WATERLOO FWB B5</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1DST DATA STRUCTURES SEM2 000001/Lecture/01 &lt;22-31></ns1:desc1><ns1:desc2>Data Structures</ns1:desc2><ns1:start>2019-02-25T16:00:00.000+00:00</ns1:start><ns1:end>2019-02-25T18:00:00.000+00:00</ns1:end><ns1:teacherName>Radzik, Tomasz;Zschaler, Steffen</ns1:teacherName><ns1:locCode>F-WBB.5</ns1:locCode><ns1:locAdd1>WATERLOO FWB B5</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1DST DATA STRUCTURES SEM2 000001/SmG/01</ns1:desc1><ns1:desc2>Data Structures</ns1:desc2><ns1:start>2019-02-25T09:00:00.000+00:00</ns1:start><ns1:end>2019-02-25T10:00:00.000+00:00</ns1:end><ns1:locCode>S4.29</ns1:locCode><ns1:locAdd1>STRAND BLDG S4.29</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1DST DATA STRUCTURES SEM2 000001/Tut/01 &lt;22-31></ns1:desc1><ns1:desc2>Data Structures</ns1:desc2><ns1:start>2019-02-25T15:00:00.000+00:00</ns1:start><ns1:end>2019-02-25T16:00:00.000+00:00</ns1:end><ns1:teacherName>Radzik, Tomasz;Zschaler, Steffen</ns1:teacherName><ns1:locCode>F-WBB.5</ns1:locCode><ns1:locAdd1>WATERLOO FWB B5</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1PPA PROGRAMMING PRA SY 000001/Discussion/19 &lt;21, 27></ns1:desc1><ns1:desc2>Personal Tutor Meeting</ns1:desc2><ns1:start>2019-02-28T12:00:00.000+00:00</ns1:start><ns1:end>2019-02-28T12:30:00.000+00:00</ns1:end><ns1:teacherName>Murphy, Josh</ns1:teacherName><ns1:locCode>#SPLUS2B4DD0</ns1:locCode><ns1:locAdd1>Bush House (SE) 2.01</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1PPA PROGRAMMING PRA SY 000001/Lecture01/01 &lt;21-31></ns1:desc1><ns1:desc2>Programming Practice and Applications.</ns1:desc2><ns1:start>2019-03-01T15:00:00.000+00:00</ns1:start><ns1:end>2019-03-01T16:00:00.000+00:00</ns1:end><ns1:teacherName>Murphy, Josh;Raphael, Jeffery;Koelling, Michael</ns1:teacherName><ns1:locCode>BHN101Aud</ns1:locCode><ns1:locAdd1>Bush House Auditorium BH (N)-1.01</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1PPA PROGRAMMING PRA SY 000001/Lecture02/01 &lt;21-31></ns1:desc1><ns1:desc2>Programming Practice and Applications</ns1:desc2><ns1:start>2019-02-28T13:00:00.000+00:00</ns1:start><ns1:end>2019-02-28T14:00:00.000+00:00</ns1:end><ns1:teacherName>Murphy, Josh;Raphael, Jeffery;Koelling, Michael</ns1:teacherName><ns1:locCode>F-WBB.5</ns1:locCode><ns1:locAdd1>WATERLOO FWB B5</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1PPA PROGRAMMING PRA SY 000001/Prac/10 &lt;22-31></ns1:desc1><ns1:desc2></ns1:desc2><ns1:start>2019-03-01T09:00:00.000+00:00</ns1:start><ns1:end>2019-03-01T11:00:00.000+00:00</ns1:end><ns1:locCode>#SPLUS04D48F</ns1:locCode><ns1:locAdd1>Bush House (S)6.03 (Lab)</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1PPA PROGRAMMING PRA SY 000001/Tut/01 &lt;21-31></ns1:desc1><ns1:desc2>Programming Practice and Applications.</ns1:desc2><ns1:start>2019-03-01T16:00:00.000+00:00</ns1:start><ns1:end>2019-03-01T17:00:00.000+00:00</ns1:end><ns1:teacherName>Murphy, Josh;Raphael, Jeffery;Koelling, Michael</ns1:teacherName><ns1:locCode>BHN101Aud</ns1:locCode><ns1:locAdd1>Bush House Auditorium BH (N)-1.01</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4SSMN110 ECONOMICS SEM2 000001/Lecture/01</ns1:desc1><ns1:desc2>Economics</ns1:desc2><ns1:start>2019-02-28T10:00:00.000+00:00</ns1:start><ns1:end>2019-02-28T12:00:00.000+00:00</ns1:end><ns1:teacherName>Darko, Chris;Lui, Silvia</ns1:teacherName><ns1:locCode>BHN101Aud</ns1:locCode><ns1:locAdd1>Bush House Auditorium BH (N)-1.01</ns1:locAdd1></ns1:calitem></ns1:calendar></ns1:retrieveCalendarResponse>'
                        }
                        callbacks.unshift(authfromrefreshtoken)
                        callbacks.unshift(getrefreshtoken)
                        cb = callbacks.shift()
                        cb(data, callbacks)

                    }
                }

            }
        })

}

function encrypt(text) {
    if (text == null || text == "") {return ""}
    var cipher = crypto.createCipher(cryptoalgorithm, cryptopassword)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text) {
    if (text == null || text == "") {return ""}

    var decipher = crypto.createDecipher(cryptoalgorithm, cryptopassword)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}

function uploadevent(uid, eventhash) {
    time = (new Date).getTime();
    var ref = admin.database().ref('users/' + uid + '/event');
    ref.update({
        [time]: eventhash,
    }).then(function() {
        console.log(uid + " Uploaded " + eventhash)
    })
}

function addeventtocalendar(data, callbacks, event, eventhash, tempinsertobject) {
    auth = data.oauth2Client
    const calendar = google.calendar({
        version: 'v3',
        auth
    });
    var currentdate = new Date(); 
    var datetime = currentdate.getDate() + "/"
    + (currentdate.getMonth()+1)  + "/" 
    + currentdate.getFullYear() + " @ "  
    + currentdate.getHours() + ":"  
    + currentdate.getMinutes() + ":" 
    + currentdate.getSeconds();
    event["description"] = event["description"] + " || Imported from calendarimporter at "+datetime

    calendar.events.insert({
        auth: auth,
        calendarId: data.calendarid,
        resource: event,
    }, function(err, event) {

        if (err) {

            for (i = 0; i < processinglist.length; i++) {
                if (processinglist[i] == tempinsertobject) {
                    processinglist.splice(i, 1);
                }
            }
            console.log('There was an error contacting the Calendar service: ' + err);
            dblogger(data.uid, 'There was an error contacting the Calendar service: ' + err)

            if (err == "Error: invalid_grant") {
                sendscheduleemail([1],'An error has occured while importing your timetable event. Please go to https://kcl-cal-to-google.herokuapp.com, log in and click sign in with google.', data)
                removeinvalidtoken(data,false)
                callbacks.unshift(removerefreshtoken)
                getuserdata(data, callbacks)

            } else {
                sendscheduleemail([5],err, data)

            }
            return;
        }
        for (i = 0; i < processinglist.length; i++) {
            if (processinglist[i] == tempinsertobject) {
                processinglist.splice(i, 1);
            }
        }
        uploadevent(data.uid, eventhash)
        console.log(data.uid + " imported event")
        dblogger(data.uid, 'Event imported. Hash: ' + eventhash)

        //console.log(event.data.htmlLink);
        cb = callbacks.shift()
        if (cb == null) {
            return
        }
        cb(data, callbacks)
    });
}

function removeinvalidtoken(data,sendresponse){
    var ref = admin.database().ref('users/' + data.uid + "/tokens");
    ref.update({
        [data.snapshot.tokentouse]: null,
    }).then(function (){
        if(sendresponse){ 
            data.response.send({
                'response': false,
                'message': "Please sign in with google again."
            });
        }
        dblogger(data.uid, 'Please sign in with google again. Refreashtoken removed')
    })
}

function checkifcallendarexists(data, callbacks){
    calendarexists = false
    auth = data.oauth2Client
    const calendar = google.calendar({
        version: 'v3',
        auth
    });
    
    
    calendar.calendarList.list({
        auth: auth,
        maxResults: 100
      },
      function (err, result) {
        if (err){
            removeinvalidtoken(data,true)
            return
        }
        //console.log(result)  
        calendars = result.data.items
        for (element in calendars){
            
            calendartemp = calendars[element]
            summary = calendartemp["summary"]
            if (summary == "Calendar Importer"){
                console.log("Using existing calendar")
                dblogger(data.uid, 'Using existing calendar')
                data.calendarid = calendartemp["id"]
                calendarexists = true
                cb = callbacks.shift()
                if (cb == null) {
                    return
                }
                cb(data, callbacks)
                break
            }
        }

        if (!calendarexists){
            console.log("Creating new calendar")
            calendar.calendars.insert({
                resource: {
                  summary: "Calendar Importer",
                  description: "Events imported through calendarimporter.herokuapp.com will be placed into this calendar. Please do not rename this calendar.",
                  timeZone: "Europe/London"
                }
              },function (err, result) {
                data.calendarid = result["data"]["id"]
                dblogger(data.uid, 'Created new calendar '+ err)
                cb = callbacks.shift()
                if (cb == null) {
                    return
                }
                cb(data, callbacks)
                

              })
        }
      }
    );

    
}

function dblogger(uid, error) {
    var milliseconds = (new Date).getTime();
    var randint = Math.floor(Math.random() * 900 + 100)
    var ref = admin.database().ref('users/' + uid + "/logs");
    ref.update({
        [milliseconds + "_" + randint]: error,
    })
}


function removerefreshtoken(data, callbacks) {
    tokenkey = data.snapshot.tokentouse
    var ref = admin.database().ref('users/' + data.uid + "/tokens");
    ref.update({
        [tokenkey]: null,
    }).then(function() {
        cb = callbacks.shift()
        if (cb == null) {
            return
        }
        cb(data, callbacks)

    });
}



function getrefreshtoken(datain, callbacks) {
    var data = datain
    var uid = data.uid

    var ref = admin.database().ref('users/' + uid);
    ref.once('value')
        .then(function(snapshot) {
            try {
                if (snapshot.val().tokens[snapshot.val().tokentouse] != null) {
                    data.refreshtoken = snapshot.val().tokens[snapshot.val().tokentouse]
                    data.snapshot = snapshot.val()
                    knumbertemp = snapshot.val().knumber
                    data.knumber = decrypt(knumbertemp)
                    passwordtemp = snapshot.val().password
                    data.password = decrypt(passwordtemp)
                    data.storedevents = snapshot.val().event
                    data.num_days= snapshot.val().num_days || "7"
                    data.duplicateevents = snapshot.val().duplicateevents || true
                    //console.log(data.refreshtoken+" "+data.knumber+" "+data.password)
                    if (data.refreshtoken == null) {
                        if (data.noresponse == null || !data.noresponse) {

                            data.response.send({
                                'message': 'Please make sure you have "Signed in with Google"',
                            });
                            dblogger(uid, "Please make sure you are logged into google. Error getting Token.")
                        } else {
                            console.log("Schedule failed due to no refresh token")
                            sendscheduleemail([1],'An error has occured while importing your timetable event. Please go to https://kcl-cal-to-google.herokuapp.com, log in and click sign in with google.', data)
                            removeinvalidtoken(data,false)
                            dblogger(uid, "Scheduled import failed due to not being logged in with google.")

                        }
                        return
                    } else if (data.knumber == null || data.password == null) {
                        if (data.noresponse == null || !data.noresponse) {

                            data.response.send({
                                'message': "Please make sure you have entered your Students login details, and pressed 'save'",
                            });
                            dblogger(uid, "Please make sure you have entered your Student Login details")

                        } else {
                            console.log("Kings details wrong. Knumber " + data.knumber)
                            dblogger(uid, "Kings details wrong.")

                            sendscheduleemail([3],'Scheduled import failed due to invalid user details. Please go to https://kcl-cal-to-google.herokuapp.com, login and check your student login details.', data)

                        }
                        return
                    }
                } else {
                    if (data.noresponse == null || !data.noresponse) {
                        data.response.send({
                            'message': 'Please "Log in with google"',
                        });
                        dblogger(uid, "Please log in with google.")

                    } else {
                        console.log(data.uid + " Schedule failed due to missing refreshtoken")
                        sendscheduleemail([1],'An error has occured while importing your timetable event. Please go to https://kcl-cal-to-google.herokuapp.com, log in and click sign in with google.', data)
                        removeinvalidtoken(data,false)
                        dblogger(uid, "Scheduled import failed due to not being logged in with google.")

                    }
                    return
                }
                cb = callbacks.shift()
                cb(data, callbacks)
            } catch (error) {
                if (data.noresponse == null || !data.noresponse) {

                    data.response.send({
                        'message': "Please Log in with google and Enter your King's details. The click save.",
                    });
                    dblogger(uid, "Please Log in with google and Enter your King's details. The click save.")

                } else {
                    console.log("Schedule failed due to missing details")
                    sendscheduleemail([3],'Scheduled import failed due to invalid user details. Please go to https://kcl-cal-to-google.herokuapp.com, login and check your student login details.', data)
                    dblogger(uid, "Scheduled import failed due to invalid student login details.")

                }
                return
            }

        })
}
inertqueueinterval = null

function queueintervalfunc(bool) {
    console.log("Interval start: " + bool.toString())
    if (bool) {
        clearInterval(inertqueueinterval)
        inertqueueinterval = setInterval(function() {
            insertqueue()
        }, 1000);
    } else {
        clearInterval(inertqueueinterval)
    }
}

function eventparser(data, callbacks) {
    xml = data.xml
    result = convert.xml2js(xml, {
        compact: true,
        spaces: 4
    });
    calendar = result["ns1:retrieveCalendarResponse"]["ns1:calendar"]["ns1:calitem"]
    newevents = []
    if (calendar == null || calendar.length != null){
        for (event in calendar) {
            var teacher;
            if (calendar[event]["ns1:teacherName"] != null) {
                teacher = calendar[event]["ns1:teacherName"]["_text"]
            } else {
                teacher = ""
            }
            var newevent = {
                'summary': calendar[event]["ns1:desc1"]["_text"],
                'location': calendar[event]["ns1:locAdd1"]["_text"],
                'description': calendar[event]["ns1:desc2"]["_text"],
                'start': {
                    'dateTime': calendar[event]["ns1:start"]["_text"],
                    'timeZone': 'Europe/London',
                },
                'end': {
                    'dateTime': calendar[event]["ns1:end"]["_text"],
                    'timeZone': 'Europe/London',
                },
                "organizer": {
                    "displayName": teacher,
                },
                'reminders': {
                    'useDefault': false,
                    'overrides': [{
                        'method': 'popup',
                        'minutes': 40
                    }, ],
                },
            };

            //console.log(JSON.stringify(newevent).split("'").join('"'))
            newevents.push(newevent)
        }
    }
    else{
        var teacher;
            if (calendar["ns1:teacherName"] != null) {
                teacher = calendar["ns1:teacherName"]["_text"]
            } else {
                teacher = ""
            }
            var newevent = {
                'summary': calendar["ns1:desc1"]["_text"],
                'location': calendar["ns1:locAdd1"]["_text"],
                'description': calendar["ns1:desc2"]["_text"],
                'start': {
                    'dateTime': calendar["ns1:start"]["_text"],
                    'timeZone': 'Europe/London',
                },
                'end': {
                    'dateTime': calendar["ns1:end"]["_text"],
                    'timeZone': 'Europe/London',
                },
                "organizer": {
                    "displayName": teacher,
                },
                'reminders': {
                    'useDefault': false,
                    'overrides': [{
                        'method': 'popup',
                        'minutes': 40
                    }, ],
                },
            };

            //console.log(JSON.stringify(newevent).split("'").join('"'))
            newevents.push(newevent)
    }


    const cbinsert = callbacks.shift()
    eventstoimport = []
    eventstoimporthash = []
    console.log(data.uid + " ignoring duplicate envents: " + data.duplicateevents)
    if (data.duplicateevents == "true" && data.storedevents != null) {
        for (event in newevents) {
            tempevent = newevents[event]
            eventstring = JSON.stringify(tempevent)
            var eventhash = crypto.createHash('md5').update(eventstring).digest('hex');
            if (!(Object.values(data.storedevents).includes(eventhash))) {
                //console.log(eventhash+" hash")
                eventstoimport.push(tempevent)
                eventstoimporthash.push(eventhash)
            }
        }
    } else {
        for (event in newevents) {
            tempevent = newevents[event]
            eventstring = JSON.stringify(tempevent)
            var eventhash = crypto.createHash('md5').update(eventstring).digest('hex');
            eventstoimport.push(tempevent)
            eventstoimporthash.push(eventhash)
        }
    }
    //console.log(data.uid + " Parsed "+newevents.length+" events")
    console.log(data.uid + " Importing " + eventstoimport.length + " events")
    dblogger(data.uid, 'Importing ' + eventstoimport.length + ' new events into your google calendar')

    if (data.scheduletrigger) {
        if (eventstoimport.length > 0) {
            sendscheduleemail([0],'Importing ' + eventstoimport.length + ' new events into your google calendar', data)

        }
    } else {
        data.response.send({
            'message': "Importing " + eventstoimport.length + " new events. Find your imported events here: https://calendar.google.com/calendar/r under Calendar Importer. If any error occur, they will be sent to your email.",
        });
    }


    for (i = 0; i < eventstoimport.length; i++) {
        var insertobject = {}
        insertobject.tempevent = eventstoimport[i]
        insertobject.tempeventhash = eventstoimporthash[i]
        insertobject.data = data
        insertobject.callbacks = callbacks
        insertobject.insertmethod = cbinsert
        console.log(data.uid + " added event to import queue")
        dblogger(data.uid, 'Added event to import queue. Hash: ' + insertobject.tempeventhash)
        importqueue.push(insertobject)
        queueintervalfunc(true)

    }


}

function insertqueue() {
    if (importqueue.length > 0) {
        console.log("Import queue length " + importqueue.length)
        tempinsertobject = importqueue.shift()
        processinglist.push(tempinsertobject)
        console.log(tempinsertobject.data.uid + " importing event")
        tempinsertobject.insertmethod(tempinsertobject.data, tempinsertobject.callbacks, tempinsertobject.tempevent, tempinsertobject.tempeventhash, tempinsertobject)
    } else {
        queueintervalfunc(false)
    }

}
var email_collector = {}
var currenttimeoutuid = {}

function sendscheduleemail(message_code,message, data) {
    tempuid = data.uid
    if (email_collector[tempuid] == null) {
        email_collector[tempuid] = {}
        email_collector[tempuid].message = []
    }
    message_obj = {}
    message_obj["body"]=message
    message_obj["codes"]=message_code
    email_collector[tempuid].message.push(message_obj)
    currenttimeoutuid[tempuid] = {}
    currenttimeoutuid[tempuid]["func"] = checkerfunction
    currenttimeoutuid[tempuid]["data"] = data
    checkerlooper(true)
}



function check_import_queue(uid) {
    found = false
    for (i = 0; i < importqueue.length; i++) {
        tempuid = importqueue[i].data.uid
        if (uid == tempuid) {
            found = true
            i = importqueue.length
        }
    }
    return found
}

function check_processing_list(uid) {
    found = false;
    for (i = 0; i < processinglist.length; i++) {
        tempuid = processinglist[i].data.uid
        if (tempuid == uid) {
            found = true
        }
    }
    return found
}


function checkerfunction(uid, data) {
    //check status
    import_queue_check = check_import_queue(uid)
    processing_list_check = check_processing_list(uid)

    if (import_queue_check || processing_list_check) {
        console.log("More items for this uid are being processed. Checking again in a short amount of time.")
        if (!(uid in currenttimeoutuid)) {
            currenttimeoutuid[uid] = {}
            currenttimeoutuid[uid]["func"] = checkerfunction
            currenttimeoutuid[uid]["data"] = data
            checkerlooper(true)
        }

    } else {
        delete currenttimeoutuid[uid]
        console.log("No more items for this uid in queue. Sending email")
        sendscheduleemailsender(email_collector[uid].message, uid)
    }
}

var interval = null

function checkerlooper(bool) {
    stop = false
    if (Object.keys(currenttimeoutuid).length == 0 && !bool) {
        stop = true
    }
    if (Object.keys(currenttimeoutuid).length > 0 && bool) {
        stop = false
    }
    
    if (stop){
        clearInterval(interval);
    }
    else{
        interval = setInterval(function() {
            checkerfunctioncalls()
        }, 5000);
    }

    
}

function checkerfunctioncalls() {
    for (uid in currenttimeoutuid) {
        func = currenttimeoutuid[uid]["func"]
        data = currenttimeoutuid[uid]["data"]
        func(uid, data)
    }
}

function sendscheduleemailsender(message, uid) {
    var final_message = []
    var message_codes_used = []
    var tempmessage = message
    for (x = 0; x < tempmessage.length;x++){
        temp_body = tempmessage[x].body
        temp_codes = tempmessage[x].codes
        if (!(temp_codes in message_codes_used)){
            message_codes_used.push(temp_codes)
            final_message.push(temp_body)
        }
    }
    console.log(final_message)
    admin.auth().getUser(uid)
        .then(function(userRecord) {
            email = userRecord.email
            var nodemailer = require('nodemailer');

            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: '[*EMAIL*]',
                    pass: '[*PASSWORD*]'
                }
            });

            var mailOptions = {
                from: '[*EMAIL*]',
                to: email,
                subject: 'Calendar Import Schedule',
                text: "Dear User, \nThank you for using the Calendar Importer. Bellow are logs about your latest import. \n \n" + final_message.join("\n \n ")+"\n \n You can find more logs at: http://calendarimporter.herokuapp.com/logs?uid="+uid+" . Find your imported events here: https://calendar.google.com/calendar/r under Calendar Importer."
            };

            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                    dblogger(uid, 'Server error. Email sending failed')
                } else {
                    console.log(uid + ' Email sent to: ' + info.envelope.to[0]);
                    dblogger(uid, 'Sent Email')

                }
            });
        })
        .catch(function(error) {
            console.log('Error fetching user data:', error);
        });
}

function authfromrefreshtoken(data, callbacks) {
    refreshtoken = data.refreshtoken
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Calendar API.
        credentials = JSON.parse(content)
        const {
            client_secret,
            client_id,
            redirect_uris
        } = credentials.installed;
        oAuth2Clienttemp = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[urlredirect]);

        oAuth2Clienttemp.setCredentials({
            refresh_token: refreshtoken
        });
        data.oauth2Client = oAuth2Clienttemp

        cb = callbacks.shift()
        cb(data, callbacks)
    })

}



app.get('/readdata', function(request, response) {
    knum = request.query.knum
    passwd = request.query.passwd
    console.log(knum + " " + passwd)
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Calendar API.
        resarr = authorize(JSON.parse(content), getloginurl)
        url = resarr[0];
        oAuth2Client = resarr[1]
        console.log(url)
        response.send({
            'response': true,
            'url': url

        });
        // const rl = readline.createInterface({
        //     input: process.stdin,
        //     output: process.stdout,
        //   }); 
        // rl.question('Enter the code from that page here: ', (code) => {
        //     rl.close();
        //     oAuth2Client.getToken(code, (err, token) => {
        //       if (err) return console.error('Error retrieving access token', err);
        //       oAuth2Client.setCredentials(token);
        //       getcallendardatakcl(knum, passwd, oAuth2Client)



        //     });
        //   });
    });


});

app.get('/importmetric', function(request, response) {
    var ref = admin.database().ref('metrics');
    ref.once('value')
        .then(function(snapshot) {
            count = snapshot.val()["import"] || "Error"
            response.send({
                'metric': count
    
            });
        })
});

app.get('/authcode', function(request, response) {
    code = request.query.code
    month = request.query.month
    console.log(month)
    code = decodeURIComponent(code)
    oAuth2Client.getToken(code, (err, token) => {
        if (err) {
            response.send({
                'response': false,
                'message': "Token error"

            });

        }


        //return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        getcallendardatakcl(knum, passwd, month, oAuth2Client)
        response.send({
            'response': true,
            'message': "Importing into your google cal"

        });


    });
});

function getcallendardatakcl(knum, passwd, month, oAuth2Client) {
    var torespond;
    console.log(month)
    var d = new Date().toISOString().slice(0, 10);
    var body = '<retrieveCalendar xmlns="http://campusm.gw.com/campusm">' +
        "<username>" + knum + "</username> " +
        "<password>" + passwd + "</password> " +
        "<calType>course_timetable</calType> " +
        "<start>" + d + "T00:00:00.000+00:00</start>" +
        "<end>" + month + "T00:00:00.000+00:00</end> " +
        "</retrieveCalendar>"

    // Set the headers
    var headers = {
        "Content-Type": "application/xml",
        "Accept-Encoding": "gzip",
        "Pragma": "no-cache",
        "User-Agent": "King's%20Mobile/9003776 CFNetwork/976 Darwin/18.2.0",
        "Accept": "*/*",
        "Accept-Language": "en-gb",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Authorization": "Basic YXBwbGYXRpb25fc2VjX3VzZXI6ZjJnaDUzNDg="

    }


    // Configure the request
    var options = {
        url: 'https://campusm.kcl.ac.uk//kcl_live/services/CampusMUniversityService/retrieveCalendar',
        host: 'campusm.kcl.ac.uk',
        method: 'POST',
        headers: headers,
        body: body
    }

    // Start the request

    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // Handle gzip
            var encoding = response.headers['content-encoding']
            if (encoding && encoding.indexOf('gzip') >= 0) {
                body = uncompress(body);
            }
            body = body.toString('utf-8');
            // Print out the response body
            //console.log(body)
            torespond = body

            parsexml(torespond, oAuth2Client);
            //event = //parse response from request
            //getloginurl(event,oAuth2Client)

        } else {
            console.log(error)
        }

    })
    return torespond;
}

function parsexml(xml, oAuth2Client) {

    var DOMParser = require('xmldom').DOMParser;
    var parser = new DOMParser();
    xmlDoc = parser.parseFromString(xml, "text/xml");


    x = xmlDoc.documentElement.childNodes;
    callitems = x[0].childNodes


    for (i = 0; i < callitems.length; i++) {
        details = callitems[i].childNodes
        var event = {}
        for (f = 0; f < details.length; f++) {
            identifier = null;
            tempnpode = details[f].firstChild;
            try {
                if (f == 0) {
                    identifier = "summary"

                    event["summary"] = tempnpode.nodeValue
                } else if (f == 1) {
                    identifier = "subject";
                    event["subject"] = tempnpode.nodeValue
                } else if (f == 2) {
                    identifier = "start";
                    start = {
                        "dateTime": tempnpode.nodeValue,
                        "timeZone": "Europe/London"
                    }
                    event["start"] = start
                } else if (f == 3) {
                    identifier = "end";
                    end = {
                        "dateTime": tempnpode.nodeValue,
                        "timeZone": "Europe/London"
                    }
                    event["end"] = end
                } else if (f == 4) {
                    identifier = "teacher";
                    event["teacher"] = tempnpode.nodeValue
                } else if (f == 5) {
                    identifier = "location code";
                    event["location"] = tempnpode.nodeValue
                } else if (f == 6) {
                    identifier = "location";
                    event["location"] = tempnpode.nodeValue
                }


                tempnpode = details[f].firstChild;
                //  if(identifier!=null){
                //      console.log(identifier+": "+tempnpode.nodeValue)
                //      var event = {
                //         'summary': 'FUCK FUCK I/O 2015',
                //         'location': '800 Howard St., San Francisco, CA 94103',
                //         'description': 'A chance to hear more about Google\'s developer products.',
                //         'start': {
                //           'dateTime': '2015-05-28T09:00:00-07:00',
                //           'timeZone': 'America/Los_Angeles',
                //         },
                //         'end': {
                //           'dateTime': '2015-05-28T17:00:00-07:00',
                //           'timeZone': 'America/Los_Angeles',
                //         }
                //         },
                //  }
            } catch (e) {
                console.log(e)
            }

        }
        event["description"] = event["subject"] + " | " + event["teacher"]
        delete event["subject"];
        delete event["subjeteacherct"];
        console.log(event)

        getloginurl(event, oAuth2Client)
        console.log("_________________")

    }
    console.log("_________________")
    console.log("_________________")
    console.log("_________________")

}

function getloginurl(auth) {
    const calendar = google.calendar({
        version: 'v3',
        auth
    });
    var event = {
        'summary': 'Google I/O 2015',
        'location': '800 Howard St., San Francisco, CA 94103',
        'description': 'A chance to hear more about Google\'s developer products.',
        'start': {
            'dateTime': '2015-05-28T09:00:00-07:00',
            'timeZone': 'America/Los_Angeles',
        },
        'end': {
            'dateTime': '2015-05-28T17:00:00-07:00',
            'timeZone': 'America/Los_Angeles',
        },
        'recurrence': [
            'RRULE:FREQ=DAILY;COUNT=2'
        ],
        'attendees': [{
                'email': 'lpage@example.com'
            },
            {
                'email': 'sbrin@example.com'
            },
        ],
        'reminders': {
            'useDefault': false,
            'overrides': [{
                    'method': 'email',
                    'minutes': 24 * 60
                },
                {
                    'method': 'popup',
                    'minutes': 10
                },
            ],
        },
    };

    calendar.events.insert({
        auth: auth,
        calendarId: 'primary',
        resource: event,
    }, function(err, event) {
        if (err) {
            console.log('There was an error contacting the Calendar service: ' + err);
            return;
        }
        console.log('Event created: %s', event.htmlLink);
    });
}


//new
app.get('/googleoauth', function(request, response) {
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) {
            response.send({
                'response': false,
            });
            return console.log('Error loading client secret file:', err);
        }
        resarr = authorize(JSON.parse(content), getloginurl)
        url = resarr[0];
        oAuth2Client = resarr[1]
        console.log("Log in URL: " + url)
        response.send({
            'response': true,
            'url': url

        });
    });

});

app.get('/cleareventdata', function(request, response) {
    var uid = request.query.uid
    console.log("Clearing event data for " + uid)
    var ref = admin.database().ref('users/' + uid);
    ref.update({
        event: null,
    }).then(function() {
        response.send({
            'message': "Discarded previously imported events ",

        });
        dblogger(uid, 'Discarded previously imported events')

    });
})

app.get('/import', function(request, response) {
    console.log("Import start")


    var data = {}
    data.request = request
    data.response = response
    var callbacks = []
    data.uid = request.query.uid
    dblogger(data.uid, 'Import starting')

    callbacks.unshift(addeventtocalendar)
    callbacks.unshift(eventparser)
    callbacks.unshift(checkifcallendarexists)
    if (!testdata) {
        callbacks.unshift(geteventsfromkcl)
    } else {
        data.xml = '<ns1:retrieveCalendarResponse xmlns:ns1="http://campusm.gw.com/campusm"><ns1:calendar><ns1:calitem><ns1:desc1>4CCS1DBS DATABASE SYSTEM SEM2 000001/Lecture/01</ns1:desc1><ns1:desc2>Database systems</ns1:desc2><ns1:start>2019-02-28T15:00:00.000+00:00</ns1:start><ns1:end>2019-02-28T17:00:00.000+00:00</ns1:end><ns1:teacherName>Michael, Brendan;Tsoka, Sophia</ns1:teacherName><ns1:locCode>F-WBB.5</ns1:locCode><ns1:locAdd1>WATERLOO FWB B5</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1DBS DATABASE SYSTEM SEM2 000001/Prac/06</ns1:desc1><ns1:desc2>Database Systems</ns1:desc2><ns1:start>2019-02-25T12:00:00.000+00:00</ns1:start><ns1:end>2019-02-25T14:00:00.000+00:00</ns1:end><ns1:locCode>#SPLUS6DAAC1</ns1:locCode><ns1:locAdd1>Bush House (S)7.01/2 (Lab)</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1DBS DATABASE SYSTEM SEM2 000001/Tut/01</ns1:desc1><ns1:desc2>Database Systems</ns1:desc2><ns1:start>2019-02-28T17:00:00.000+00:00</ns1:start><ns1:end>2019-02-28T18:00:00.000+00:00</ns1:end><ns1:teacherName>Michael, Brendan;Tsoka, Sophia</ns1:teacherName><ns1:locCode>F-WBB.5</ns1:locCode><ns1:locAdd1>WATERLOO FWB B5</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1DST DATA STRUCTURES SEM2 000001/Lecture/01 &lt;22-31></ns1:desc1><ns1:desc2>Data Structures</ns1:desc2><ns1:start>2019-02-25T16:00:00.000+00:00</ns1:start><ns1:end>2019-02-25T18:00:00.000+00:00</ns1:end><ns1:teacherName>Radzik, Tomasz;Zschaler, Steffen</ns1:teacherName><ns1:locCode>F-WBB.5</ns1:locCode><ns1:locAdd1>WATERLOO FWB B5</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1DST DATA STRUCTURES SEM2 000001/SmG/01</ns1:desc1><ns1:desc2>Data Structures</ns1:desc2><ns1:start>2019-02-25T09:00:00.000+00:00</ns1:start><ns1:end>2019-02-25T10:00:00.000+00:00</ns1:end><ns1:locCode>S4.29</ns1:locCode><ns1:locAdd1>STRAND BLDG S4.29</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1DST DATA STRUCTURES SEM2 000001/Tut/01 &lt;22-31></ns1:desc1><ns1:desc2>Data Structures</ns1:desc2><ns1:start>2019-02-25T15:00:00.000+00:00</ns1:start><ns1:end>2019-02-25T16:00:00.000+00:00</ns1:end><ns1:teacherName>Radzik, Tomasz;Zschaler, Steffen</ns1:teacherName><ns1:locCode>F-WBB.5</ns1:locCode><ns1:locAdd1>WATERLOO FWB B5</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1PPA PROGRAMMING PRA SY 000001/Discussion/19 &lt;21, 27></ns1:desc1><ns1:desc2>Personal Tutor Meeting</ns1:desc2><ns1:start>2019-02-28T12:00:00.000+00:00</ns1:start><ns1:end>2019-02-28T12:30:00.000+00:00</ns1:end><ns1:teacherName>Murphy, Josh</ns1:teacherName><ns1:locCode>#SPLUS2B4DD0</ns1:locCode><ns1:locAdd1>Bush House (SE) 2.01</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1PPA PROGRAMMING PRA SY 000001/Lecture01/01 &lt;21-31></ns1:desc1><ns1:desc2>Programming Practice and Applications.</ns1:desc2><ns1:start>2019-03-01T15:00:00.000+00:00</ns1:start><ns1:end>2019-03-01T16:00:00.000+00:00</ns1:end><ns1:teacherName>Murphy, Josh;Raphael, Jeffery;Koelling, Michael</ns1:teacherName><ns1:locCode>BHN101Aud</ns1:locCode><ns1:locAdd1>Bush House Auditorium BH (N)-1.01</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1PPA PROGRAMMING PRA SY 000001/Lecture02/01 &lt;21-31></ns1:desc1><ns1:desc2>Programming Practice and Applications</ns1:desc2><ns1:start>2019-02-28T13:00:00.000+00:00</ns1:start><ns1:end>2019-02-28T14:00:00.000+00:00</ns1:end><ns1:teacherName>Murphy, Josh;Raphael, Jeffery;Koelling, Michael</ns1:teacherName><ns1:locCode>F-WBB.5</ns1:locCode><ns1:locAdd1>WATERLOO FWB B5</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1PPA PROGRAMMING PRA SY 000001/Prac/10 &lt;22-31></ns1:desc1><ns1:desc2></ns1:desc2><ns1:start>2019-03-01T09:00:00.000+00:00</ns1:start><ns1:end>2019-03-01T11:00:00.000+00:00</ns1:end><ns1:locCode>#SPLUS04D48F</ns1:locCode><ns1:locAdd1>Bush House (S)6.03 (Lab)</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4CCS1PPA PROGRAMMING PRA SY 000001/Tut/01 &lt;21-31></ns1:desc1><ns1:desc2>Programming Practice and Applications.</ns1:desc2><ns1:start>2019-03-01T16:00:00.000+00:00</ns1:start><ns1:end>2019-03-01T17:00:00.000+00:00</ns1:end><ns1:teacherName>Murphy, Josh;Raphael, Jeffery;Koelling, Michael</ns1:teacherName><ns1:locCode>BHN101Aud</ns1:locCode><ns1:locAdd1>Bush House Auditorium BH (N)-1.01</ns1:locAdd1></ns1:calitem><ns1:calitem><ns1:desc1>4SSMN110 ECONOMICS SEM2 000001/Lecture/01</ns1:desc1><ns1:desc2>Economics</ns1:desc2><ns1:start>2019-02-28T10:00:00.000+00:00</ns1:start><ns1:end>2019-02-28T12:00:00.000+00:00</ns1:end><ns1:teacherName>Darko, Chris;Lui, Silvia</ns1:teacherName><ns1:locCode>BHN101Aud</ns1:locCode><ns1:locAdd1>Bush House Auditorium BH (N)-1.01</ns1:locAdd1></ns1:calitem></ns1:calendar></ns1:retrieveCalendarResponse>'
    }
    callbacks.unshift(authfromrefreshtoken)
    callbacks.unshift(getrefreshtoken)
    cb = callbacks.shift()
    cb(data, callbacks)

});

function geteventsfromkcl(data, callbacks) {
    var date = new Date()
    start = date.toISOString().slice(0, 10);
    days_to_import = parseInt(data.num_days, 10)
    date.setDate(date.getDate() + days_to_import);
    end = date.toISOString().slice(0, 10);
    var body = '<retrieveCalendar xmlns="http://campusm.gw.com/campusm">' +
        "<username>" + data.knumber + "</username>" +
        "<password>" + data.password + "</password>" +
        "<calType>course_timetable</calType>" +
        "<start>" + start + "T00:00:00.000+02:00</start>" +
        "<end>" + end + "T00:00:00.000+02:00</end>" +
        "</retrieveCalendar>"

    // Set the headers
    var headers = {
        "Content-Type": "application/xml",
        "Accept-Encoding": "gzip",
        "Pragma": "no-cache",
        "User-Agent": "King's%20Mobile/9003776 CFNetwork/976 Darwin/18.2.0",
        "Accept": "*/*",
        "Accept-Language": "en-gb",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Authorization": "Basic ="

    }

    // Configure the request
    var options = {
        url: 'https://campusm.kcl.ac.uk//kclNewTimetable/services/CampusMUniversityService/retrieveCalendar',
        host: 'campusm.kcl.ac.uk',
        method: 'POST',
        headers: headers,
        body: body
    }

    // Start the request
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {

            //console.log(body)
            //console.log(response)

            // Handle gzip
            var encoding = response.headers['content-encoding']
            if (encoding && encoding.indexOf('gzip') >= 0) {
                body = uncompress(body);
            }
            body = body.toString('utf-8');
            //console.log(body)
            data.xml = body
            cb = callbacks.shift()
            cb(data, callbacks)
        } else {
            console.log(response)
            if (data.noresponse == null || !data.noresponse) {

                data.response.send({
                    'message': "Unable to fetch Calendar from the King's app. Please make sure your King's Login is correct and then press save.",
                });
                dblogger(data.uid, 'Unable to fetch Calendar from the Kings app. Please make sure your Kings Login is correct and then press save.')

            } else {
                console.log("Scheduled import failed due to missing KCL login details. Knumber: " + data.knumber)
                dblogger(data.uid, 'Scheduled import failed due to missing KCL login details.')

                sendscheduleemail([2],'Scheduled import failed due to missing student login details. Please go to https://kcl-cal-to-google.herokuapp.com, login and re enter your details.', data)

            }
            return

        }

    })
}


app.get('/getrefresh', function(request, response) {
    // Load client secrets from a local file.
    var data = {}
    var callbacks = []
    data.request = request
    data.refresh_token = null
    data.response = response
    data.uid = request.query.uid
    knumbertemp = request.query.knumber || null
    data.knumber = decrypt(knumbertemp)
    console.log(data.knumber)
    data.code = request.query.token || null
    passwordtemp = request.query.password || null
    data.password = decrypt(passwordtemp)
    console.log(data.password)
    data.url = request.query.url || null
    if (data.code != null) {
        dblogger(data.uid, "Signing in to google")
        callbacks.unshift(saverefreshtokenfirebase)
        callbacks.unshift(getUsersEmailId)
        callbacks.unshift(generaterefreshtoken)
        callbacks.unshift(getuserdata)

    } else {
        dblogger(data.uid, "Signing out of google")
        callbacks.unshift(saverefreshtokenfirebase)
    }


    cb = callbacks.shift()
    cb(data, callbacks)


});

function getuserdata(data, callbacks) {
    var ref = admin.database().ref('users/' + data.uid);
    ref.once('value')
        .then(function(snapshot) {
            data.snapshot = snapshot.val()
            cb = callbacks.shift()
            cb(data, callbacks)
        })
}

function getUsersEmailId(data, callbacks) {

    var auth = data.oauthclient
    var oauth2 = google.oauth2({
        auth: auth,
        version: 'v2'
    });

    oauth2.userinfo.v2.me.get(
        function(err, res) {
            if (err) {
                console.log(err);
            } else {
                data.googleaccountid = res.data.id

            }
            cb = callbacks.shift()
            cb(data, callbacks)
        });

}

app.get('/save', function(request, response) {
    // Load client secrets from a local file.
    var data = {}
    var callbacks = []
    data.request = request
    data.refresh_token = null
    data.response = response
    data.uid = request.query.uid
    dblogger(data.uid, 'Details saved')
    data.scheduleday = request.query.schedule
    data.num_days = request.query.num_days || "7"
    if (data.num_days>30){
        data.num_days = "7"
    }
    data.duplicateevents = request.query.duplicateevents
    knumbertemp = request.query.knumber || null
    data.knumber = encrypt(knumbertemp)
    data.code = request.query.token || null
    passwordtemp = request.query.password || null
    data.password = encrypt(passwordtemp)
    data.url = request.query.url || null
    callbacks.unshift(savetofirebase)
    if (data.code != null) {
        //callbacks.unshift(generaterefreshtoken)
    }
    cb = callbacks.shift()
    cb(data, callbacks)


});


app.get('/logs', function(request, response) {
    // Load client secrets from a local file.
    var data = {}
    var callbacks = []
    data.request = request
    data.response = response
    var uid = request.query.uid
    data.response.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    var ref = admin.database().ref('users/' + uid);
    ref.once('value')
        .then(function(snapshot) {
            try {
                loggsarr = snapshot.val().logs
                daisplayamount = 200
                data.response.write('Last ' + daisplayamount + ' Logs:\n');
                console.log(uid + " Total " + Object.keys(loggsarr).length + " logs")
                counter = 0;
                todisplaystart = Object.keys(loggsarr).length - daisplayamount // show last 50 logs
                for (log in loggsarr) {
                    if (counter > todisplaystart) {
                        //console.log(log)
                        templog = loggsarr[log]
                        var utcSeconds = parseInt((log.split('_')[0]), 10) / 1000;
                        var d = new Date(0)
                        d.setUTCSeconds(utcSeconds);

                        data.response.write(d.toLocaleString("en-US", {
                            timeZone: "Europe/London"
                        }) + " :: " + templog + '\n');
                    }

                    counter++
                }
                response.end();
            } catch (error) {
                console.log(error)
                data.response.write('Error fetching logs. Please enter your information on the homepage and click save.');
                response.end();
            }

        })



});

app.get('/gotrefresh', function(request, response) {
    // Load client secrets from a local file.
    var data = {}
    var callbacks = []
    data.request = request
    data.response = response
    data.uid = request.query.uid
    callbacks.unshift(respondgotrefresh)
    callbacks.unshift(checkforrefresh)
    cb = callbacks.shift()
    cb(data, callbacks)


});

function checkforrefresh(data, callbacks) {
    try {
        var ref = admin.database().ref('users/' + uid);
        ref.once('value')
            .then(function(snapshot) {
                try {
                    if (data.refreshtoken = snapshot.val().tokens[snapshot.val().tokentouse] != null) {
                        data.gotrefresh = true
                    } else {
                        data.gotrefresh = false
                    }
                } catch (error) {
                    data.gotrefresh = false
                }
                cb = callbacks.shift()
                cb(data, callbacks)
            })
    } catch (error) {
        if (data.scheduletrigger) {
            sendscheduleemail([1],'An error has occured while importing your timetable event. Please go to https://kcl-cal-to-google.herokuapp.com, log in and click sign in with google.', data)
            removeinvalidtoken(data,false)
        } else {

            data.response.send({
                'message': "Please log in with google",
            });
        }


        return
    }


}

function respondgotrefresh(data, callbacks) {
    data.response.send({
        'response': data.gotrefresh,
    });
}


function generaterefreshtoken(data, callbacks) {
    if (data.code == null) {
        cb = callbacks.shift()
        cb(data, callbacks)
    } else {
        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Calendar API.
            credentials = JSON.parse(content)
            const {
                client_secret,
                client_id,
                redirect_uris
            } = credentials.installed;
            const oAuth2Client = new google.auth.OAuth2(
                client_id, client_secret, redirect_uris[urlredirect]);
            var tempoauthclient = oAuth2Client
            data.oauthclient=tempoauthclient
            oAuth2Client.getToken(decodeURIComponent(data.code), (err, token) => {
                if("refresh_token" in token || "access_token" in token){
                    tempoauthclient.setCredentials(token);
                    data.oauthclient=tempoauthclient
                }
                if(!("refresh_token" in token)){
                    if("access_token" in token && err == null){
                        //get account id
                        data.access_token = token["access_token"]

                    }
                    else{
                        if (data.scheduletrigger) {
                            sendscheduleemail([6],'Scheduled import failed due to google account being revoked. Please go to https://myaccount.google.com/permissions and revoke calendar importer. Then go to https://kcl-cal-to-google.herokuapp.com, login and click sign out of google. Then click log in with google', data)
                        } else {
                            data.response.send({
                                'response': false,
                                'message': "Please revoke access to Calendar Imported here: https://myaccount.google.com/permissions. Then try logging in again."
                            });
                        }
                        dblogger(data.uid, 'Scheduled import failed due to google account being revoked. Please go to https://myaccount.google.com/permissions and revoke calendar importer. Then go to https://kcl-cal-to-google.herokuapp.com, login and click sign out of google. Then click log in with google. ' + err)
                        return
                    }
                }else{
                        data.refresh_token = token["refresh_token"]
                }

                cb = callbacks.shift()
                if (cb == null) {
                    return
                }
                cb(data, callbacks)
            });

        })
    }

}


function saverefreshtokenfirebase(data, callbacks) {
    refresh_token = data.refresh_token || null
    var adaNameRef = admin.database().ref('users/' + data.uid + '/tokens');
    if (refresh_token != null) {
        adaNameRef.update({
            [data.googleaccountid]: refresh_token

        }).then(function() {
            var adaNameRef2 = admin.database().ref('users/' + data.uid);
            adaNameRef2.update({
                tokentouse: data.googleaccountid
            }).then(function() {
                
                data.response.send({
                    'response': true,
                    'url': data.url

                });
                cb = callbacks.shift()
                if (cb == null) {
                    return
                }
                cb(data, callbacks)
            })
        })

    } else if (data.code == null) {
        var adaNameRef2 = admin.database().ref('users/' + data.uid);
        adaNameRef2.update({
            tokentouse: null
        }).then(function() {
            data.response.send({
                'response': true,
                'url': data.url

            });
            cb = callbacks.shift()
            if (cb == null) {
                return
            }
            cb(data, callbacks)
        })

    } else {
        var adaNameRef2 = admin.database().ref('users/' + data.uid);
        adaNameRef2.update({
            tokentouse: data.googleaccountid
        }).then(function() {
                if (data.snapshot["tokens"] == null){
                    data.response.send({
                        'response': false,
                        'message': "Please revoke access to Calendar Imported here: https://myaccount.google.com/permissions. Then try logging in again."
                    });
                    dblogger(data.uid, 'Scheduled import failed due to google account being revoked. Please go to https://myaccount.google.com/permissions and revoke calendar importer. Then go to https://kcl-cal-to-google.herokuapp.com, login and click sign out of google. Then click log in with google.')
                    return
                }
                else if(data.snapshot["tokens"][data.googleaccountid]==null){
                    data.response.send({
                        'response': false,
                        'message': "Please revoke access to Calendar Imported here: https://myaccount.google.com/permissions. Then try logging in again."
                    });
                    dblogger(data.uid, 'Scheduled import failed due to google account being revoked. Please go to https://myaccount.google.com/permissions and revoke calendar importer. Then go to https://kcl-cal-to-google.herokuapp.com, login and click sign out of google. Then click log in with google.')
                    return
                }

            data.response.send({
                'response': true,
                'url': data.url

            });
            cb = callbacks.shift()
            if (cb == null) {
                return
            }
            cb(data, callbacks)
        })
    }

}

function savetofirebase(data, callbacks) {
    refresh_token = data.refresh_token || null
    var today = new Date();
    var adaNameRef = admin.database().ref('users/' + data.uid);
    if (data.knumber!="" && data.knumber!=null){
    adaNameRef.update({
        knumber: data.knumber,

    }).then(function() {
        
    })
    }
    if (data.password!="" && data.password!=null){
        adaNameRef.update({
            password: data.password,

        }).then(function() {
            
        })
    }

    adaNameRef.update({
        token: data.code,
        url: data.url,
        time: today,
        duplicateevents: data.duplicateevents,
        schedule: data.scheduleday[0],
        num_days:data.num_days
    }).then(function() {
        data.response.send({
            'response': true,
            'url': data.url

        });
        cb = callbacks.shift()
        if (cb == null) {
            return
        }
        cb(data, callbacks)
    })
}

app.get('/getdata', function(request, response) {
    // Load client secrets from a local file.
    knumber = ""
    knumber = ""
    duplicateevents = true;
    scheduledays = 0
    uid = request.query.uid
    var ref = admin.database().ref('users/' + uid);
    ref.once('value')
        .then(function(snapshot) {
            try {
                //console.log(snapshot.val())
                knumbertemp = snapshot.val().knumber || ""
                knumber = decrypt(knumbertemp)
                duplicateevents = snapshot.val().duplicateevents || "true"
                scheduledays = snapshot.val().schedule || "0"
                num_days = snapshot.val().num_days || "7"

                token = snapshot.val().token || ""
                password = snapshot.val().password || ""


            } catch (error) {
                console.log("No data for the user " + error)
                knumber = ""
                duplicateevents = true;
                scheduledays[0] = 0

            }
            response.send({
                'response': true,
                'knumber': knumber,
                'duplicateevents': duplicateevents,
                'scheduledays': scheduledays[0],
                'num_days':num_days


            });
        });
});

//serve main page
app.use(express.static(__dirname + '/public', {
    extensions: ['html', 'htm'],

}));


app.listen(PORT, () => console.log(`Listening on ${ PORT }`));