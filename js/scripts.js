//Function: unhide multiple div's to allow for more user input when
//creating an account(First and last name; email address)
function signUpStart() {
  var emailInput = document.getElementById("emailInput");
  var nameInput = document.getElementById("nameInput");
  var lastNameInput = document.getElementById("lastNameInput");
  var d = document.getElementById("submitClick").classList;
  var a = document.getElementById("submitClick").onclick = signUp;
  emailInput.style.display = "block";
  nameInput.style.display = "block";
  lastNameInput.style.display = "block";
  document.getElementById("signUpButtonText").innerHTML='Submit <i class="material-icons right">send</i>';
}

//Function: Gets all available values from input boxes and creates a new
//CloudObject in the User Table. A CloudObject is a single tuple in the
//selected table. The User table requires a username, password, email,
//and first name from available text based input boxes. The table also requires
//the user's current location as a GeoPoint(an object that contains the user's)
//current latitude and longitute) as well as the user's point of interest and
//and the type of taxi that the user would prefer to ride in. On successful
//signup, the hailTaxi function is then called.
function signUp() {
  var my_username = document.getElementById("user_name").value;
  var my_password = document.getElementById("password").value;
  var my_email = document.getElementById("email").value;
  var my_firstName = document.getElementById("firstName").value;
  var user_destination = document.getElementById("user_destination").value;
  var taxi_type = document.getElementById("taxi_preference").value;
  var userLocation = pos;
  var current_lat = pos["lat"];
  var current_lng = pos["lng"];
  var geoPoint = new CB.CloudGeoPoint(current_lng,current_lat);
  var user = new CB.CloudUser();
  user.set('username', my_username);
  user.set('password', my_password);
  user.set('fName',my_firstName);
  user.set('email', my_email);
  user.set('userDestination', user_destination);
  user.set('taxiType', taxi_type);
  user.set('userLocation', userLocation);
  user.set('userGeoPoint', geoPoint);
  user.signUp({
    success: function(user) {
      //registration successful
      $('#modal1').closeModal();
      hailTaxi(user_destination, geoPoint, taxi_type);
      ;
    },
    error: function(err) {
      //registration error
      Materialize.toast('Registation error: ' + user, 4000);

    }
  })
}

//Function: Gets all available values from input baxes and creates a new
//CloudObject in the User Table. The fields of the user table are modified only
//after a user has successfully logged in and been verified by the server. Once
//verified, the CloudObject tuple has each field set that the User table
//requires and then calls a Save function which overwrites all existing
//attributes in that user's tuple. On successful login, the script checks what
//role the logged in user has in the database(admin or user; admins are created
//within the database and not through the front end website). If the user is
//verified as an admin, they are directed separately to admin.html while users
//will have the hailTaxi function called.
function login() {
  var my_username = document.getElementById("user_name").value;
  var my_password = document.getElementById("password").value;
  var user_destination = document.getElementById("user_destination").value;
  var taxiType = document.getElementById("taxi_preference").value;
  var current_location = pos;
  var current_lat = pos["lat"];
  var current_lng = pos["lng"];
  var geoPoint = new CB.CloudGeoPoint(current_lng,current_lat);
  var user = new CB.CloudUser();
  user.set('username', my_username);
  user.set('password', my_password);
  user.logIn({
     success: function(user) {
    //   Login successfull
      var currentUser = CB.CloudUser.current;
      currentUser.set('userDestination', user_destination);
      currentUser.set('taxiType', taxiType);
      user.set('userLocation', current_location);
      user.set('userGeoPoint', geoPoint);
      currentUser.save({
        success: function(obj) {
          //Saving successfull
          //obj is instance of CloudObject
        },
        error: function(err) {
          //Error occured in saving the object
          Materialize.toast('Login error: ' + err, 4000);

        }
      })
      $('#modal1').closeModal();
      if(my_username === "admin") {
        window.location="admin.html";
      } else {
        hailTaxi(user_destination, geoPoint, taxiType);
      }
    },
    error: function(err) {
      //Error occured in user registration.
    }
  })
}

//Function: Uses a query to find the closest taxi to the user's current
//position, the query returns a list of all taxi's within the specified range
//in meters(for this service 1000000m or 100 km seemed like a good number).
//This list is ordered by shortest distance between GeoPoints. Upon successfully
//finding taxi's within the user's vicinity, the script then verifies if the
//taxi is of the correct type and if the taxi is currently serving a separate
//customer. Upon successfully finding an available taxi of the correct type,
//the script converts the users point of interest into coordinates that the
//taxi is able to understand. The corresponding tuple in the Taxi table is then
//modified to update the status of the taxi to 'Enroute' and set the destination
//to the calculated coordinates, and finally to set the coordinates of the user
//so the taxi can begin its journey to pick up the current customer. When a taxi
//tuple has been successfully saved and enroute to the customer, the user is
//directed to the next frontend webpage, directions.html
function hailTaxi(userDestination, geoPoint, type) {
  var end = 0;
  var query = new CB.CloudQuery("Taxi");
  query.near("currentGeoPoint", geoPoint, 100000);
  query.find({
    success : function(list){
      var Taxi = null;
      for(i=0; i<list.length; i++) {
        var taxiFlag = list[i].get("flag");
        var flag = taxiFlag.get("id");
        var status = list[i].get("currentStatus");
        if(flag == "pJhbWJ0S" && type == 3 && status !== "Enroute") {
          Taxi = list[i];
        }
        else if (flag == "1hI2rJt0" && type == 2 && status !== "Enroute") {
          Taxi = list[i];
        }
        else if (flag == "Bb6rNmzv" && type == 1 && status !== "Enroute") {
          Taxi = list[i];
        }
      }
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode( {'address' : userDestination}, function(results, status) {
        if (status == 'OK') {
          lat = results[0].geometry.location.lat();
          lng = results[0].geometry.location.lng();
          var destGeoPoint = new CB.CloudGeoPoint(lng, lat);
          var taxiLocation = Taxi.get("currentGeoPoint");
          Taxi.set("currentStatus", "Enroute");
          Taxi.set("destination", destGeoPoint);
          Taxi.set("pickUpCoords", geoPoint);
          Taxi.save({
            success: function(obj) {
              //Saving successfull
              //obj is instance of CloudObject
              window.location="directions.html";
            },
            error: function(err) {
              //Error occured in saving the object
            }
          });
        }
        else {
          console.log("Error" + status);
        }
      });
      //list is an array of CloudObjects.
    }, error : function(error){
      console.log(error);
      //error
    }
  });
}

//Function: Gets all the necessary values to create a payment tuple in Payments
//Table. This table requires the user, tranaction number, rate, and fare. This
//is a simulated service and no transactions are ever made so the transaction
//number is a random 6 digit number not starting with 0. After all the necessary
//attributes are collected, they are passed to the processTransaction and
//updateLogs functions based on whichever taxi they correspond to.
function updateTransaction(distance) {
  var currentUser = CB.CloudUser.current;
  var currentID = currentUser.get("id");
  var randTransactionID = Math.floor(Math.random() * 899999 + 100000);
  var taxiType = currentUser.get("taxiType");
  if(taxiType == 1) {
    var query = new CB.CloudQuery("Rates");
    query.equalTo("id", "Bb6rNmzv");
    query.find({
      success: function(list) {
        rate = list[0].get("Rate");
        processTransaction(randTransactionID, currentID, rate, distance);
        updateLogs(randTransactionID, currentID, rate, distance);
      },
      error: function(err) {

      }
    });
  }
  else if (taxiType == 2) {
    var query = new CB.CloudQuery("Rates");
    query.equalTo("id","1hI2rJt0");
    query.find({
      success: function(list) {
        rate = list[0].get("Rate");
        processTransaction(randTransactionID, currentID, rate, distance);
        updateLogs(randTransactionID, currentID, rate, distance);
      },
      error: function(err) {

      }
    });
  }
  else if (taxiType == 3) {
    var query = new CB.CloudQuery("Rates");
    query.equalTo("id","pJhbWJ0S");
    query.find({
      success: function(list) {
        rate = list[0].get("Rate");
        processTransaction(randTransactionID, currentID, rate, distance);
        updateLogs(randTransactionID, currentID, rate, distance);
      },
      error: function(err) {

      }
    });
  }
}

//Function: Initiates a new CloudObject tuple in the Payments table and inserts
//all values required of the table[tranactionID, memberID, Rate, and Fare].
//The script then saves these values into the database as a completed tuple.
function processTransaction(transID, memberID, rate, distance) {
  var newPayment = new CB.CloudObject("Payments");
  newPayment.set("transactionID", transID);
  newPayment.relate("memberID", "User", memberID);
  newPayment.set("Rate", rate);
  var fare = rate * distance.replace(' mi', '');
  newPayment.set("Fare", fare);
  newPayment.save({
    success: function(obj) {
      //Saving Successful
    },
    error: function(err) {
      //Error occured in save
    }
  });
}

//Function: Initiates a new CloudObject tuple in the Logs table. The logs table
//has the most attributes[memberID, transactionID, vehicleID, locationPickup,
//locationDropOff, distance, timeStart, and timeEnd]. All these are details that
//would be useful for data analytics within the company. The taxi in use for the
//specific user is determined by determining which taxi has the pickUpCoords
//that match the user's location. They cannot be easily compared directly and
//finding the taxi within 10 meters of the coordinates is more efficent. The
//current time is determined using the native Date object within javascript and
//using multiple get methods to display it in the correct format. Since this is
//all simulated activity and theres no possible way to retrieve a true duration
//for this service, the time is estimated by calculating how long it would take
//for the taxi to travel in "optimal" traffic condition and obeying the speed
//limit. This duration is calculated in the directions.js file. Upon Successful
//creation of a Logs tuple in the database, the callOffTaxi function is called
//to end the simulation of the taxi pickup, service, and dropoff.
function updateLogs(transID, memberID, rate, distance) {
  var currentUser = CB.CloudUser.current;
  var currentGeoPoint = currentUser.get("userGeoPoint");
  var destination = currentUser.get("userDestination");
  var query = new CB.CloudQuery("Taxi");
  query.near("pickUpCoords", currentGeoPoint, 10);
  query.find({
    success: function(list) {
      var taxiID = list[0].get("id");
      var dropOffCoords = list[0].get("destination");
      var duration = document.getElementById("duration").innerHTML
      var n = duration.includes("hour");
      var d = new Date();
      var currentDate = d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate() + ", " + d.getHours() + ":" + d.getMinutes();
      if (n) {
        var noHours = duration.replace(" hour ", ":");
        var noMins = noHours.replace(" mins", "");
        var indexOfColon = noMins.indexOf(":");
        var numHours = parseInt(noMins.slice(0, indexOfColon));
        var numMinutes = parseInt(noMins.slice(indexOfColon+1, noMins.length));
        d.setHours(d.getHours() + numHours);
        d.setMinutes(d.getMinutes() + numMinutes);
      }
      else {
        var numHours = 0;
        var numMinutes = duration.replace(" mins", "");
        d.setMinutes(d.getMinutes() + numMinutes);
      }
      var dropOffDate = d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate() + ", " + d.getHours() + ":" + d.getMinutes();
      var newLog = new CB.CloudObject("Logs");
      newLog.relate("memberID", "User", memberID);
      newLog.set("TransactionID", transID);
      newLog.relate("vehicleID", "Taxi", taxiID);
      newLog.set("locationPickup", currentGeoPoint);
      newLog.set("locationDropOff", destination);
      newLog.set("locationDropOffCoords", dropOffCoords);
      newLog.set("distance", distance);
      newLog.set("timeStart", currentDate);
      newLog.set("timeEnd", dropOffDate);
      newLog.save({
        success: function(obj) {
          //Successful save
          callOffTaxi(taxiID, numHours, numMinutes);
        },
        error: function(err) {
          //Log error
          console.log(err);
        }
      });
    },
    error: function(err) {

    }
  });
}

//Function: As a limit of no actual hardware in use and this being a simulated
//implemetation, all users are picked up, serviced, and dropped off in a matter
//of seconds. This function modifies the values in the Taxi table to return to
//their original values. Our Taxi's are efficient enough to only use 3% of their
//electric battery over the course of an hour and 0.05% every minute. This
//decrease in battery life is calculated and updated to the taxi's. The destination
//column is turned into the station where the taxi originally left from. It's
//pickUpCoords are set to (0,0). The function ends by successfully saving Our
//modifications.
function callOffTaxi(id, numHours, numMinutes) {
  var usedTaxi = new CB.CloudQuery("Taxi");
  usedTaxi.equalTo("id", id);
  usedTaxi.find({
    success: function(list) {
      var taxi = list[0];
      var newBatteryLife = taxi.get("batteryLife") - ((3 * numHours) +(0.05 * numMinutes));
      var emptyCoords = new CB.CloudGeoPoint(0,0);
      taxi.set("currentStatus", "Charging");
      taxi.set("batteryLife", Math.round(newBatteryLife));
      taxi.set("destination", taxi.get("currentGeoPoint"));
      taxi.set("pickUpCoords", emptyCoords);
      taxi.save({
        success: function(obj) {
          //Success
        },
        error: function(err) {
          console.log(err)
        }
      });
    },
    error: function(err) {
      console.log(err);
    }
  });
}

//Function: This function solely modifies HTML elements of the admin.html page.
//It allows for multiple page layouts with a tabbed interface. Each page not in
//use is hidden while the active one is displayed. The title of the page is
//updated within the navBar as well.
function activeOn(clickedID) {
  var idList = ["About", "Taxi Management", "Records", "Transactions", "Stations"];
  var thisClick = document.getElementById(clickedID);
  thisClick.style["background-color"] = "#ee6e73";
  document.getElementById("currentTitle").innerHTML = idList[thisClick.value];
  var findCurrentVal = document.getElementById("active").value;
  document.getElementById("active").style["background-color"] = "transparent";
  document.getElementById("active").id = idList[findCurrentVal];
  thisClick.id = "active";
  var clickedValue = thisClick.value
  switch (clickedValue) {
    case 0:
      document.getElementById("aboutPage").style.display = "block";
      document.getElementById("taxiManagement").style.display = "none";
      document.getElementById("recordManagement").style.display = "none";
      document.getElementById("transactionManagement").style.display = "none";
      document.getElementById("stationManagement").style.display = "none";
      break;
    case 1:
      document.getElementById("aboutPage").style.display = "none";
      document.getElementById("taxiManagement").style.display = "block";
      document.getElementById("recordManagement").style.display = "none";
      document.getElementById("transactionManagement").style.display = "none";
      document.getElementById("stationManagement").style.display = "none";
      break;
    case 2:
      document.getElementById("aboutPage").style.display = "none";
      document.getElementById("taxiManagement").style.display = "none";
      document.getElementById("recordManagement").style.display = "block";
      document.getElementById("transactionManagement").style.display = "none";
      document.getElementById("stationManagement").style.display = "none";
      break;
    case 3:
      document.getElementById("aboutPage").style.display = "none";
      document.getElementById("taxiManagement").style.display = "none";
      document.getElementById("recordManagement").style.display = "none";
      document.getElementById("transactionManagement").style.display = "block";
      document.getElementById("stationManagement").style.display = "none";
      break;
    case 4:
      document.getElementById("aboutPage").style.display = "none";
      document.getElementById("taxiManagement").style.display = "none";
      document.getElementById("recordManagement").style.display = "none";
      document.getElementById("transactionManagement").style.display = "none";
      document.getElementById("stationManagement").style.display = "block";
      break;
    default:

  }
}

//Function: This function allows for the insertion of a new Taxi tuple in the
//Taxi table. The script grabs values that can be entered by the administrator
//and created a new CloudObject to allow for the storage of these attributes.
//The taxi type that can be enter[sedan, crossover, or van] allows for the script
//to determine which flag should be used. These are our subclass attributes.
//The script needs to run a query to find the address of the city entered within
//the Cities table. With every added taxi to the database, the dnutChart function
//is called to aggregate our database to show how many taxis of each type exist.
//The function ends with the successful insertion to our database.
function newTaxi() {
  var taxiID = document.getElementById("taxi").value;
  var taxiType = document.getElementById("type").value;
  var cityID = document.getElementById("city").value;
  var batteryLife = document.getElementById("charge").value;
  var newTaxi = new CB.CloudObject("Taxi");
  newTaxi.set("vehicleID", parseInt(taxiID));
  newTaxi.set("batteryLife", parseInt(batteryLife));
  newTaxi.set("currentStatus", "Charging");
  if(taxiType == 1) {
    newTaxi.relate("flag", "Rates", "Bb6rNmzv");
  }
  else if (taxiType == 2) {
    newTaxi.relate("flag", "Rates", "1hI2rJt0");
  }
  else {
    newTaxi.relate("flag", "Rates", "pJhbWJ0S");
  }
  newTaxi.relate("city", "Cities", cityID);
  var cityAddress = CB.CloudObject("Cities");
  var query = new CB.CloudQuery("Cities")
  query.equalTo("cityName", cityID);
  query.find({
    success: function(list){
      newTaxi.set("currentLocation", list[0].get("Address"));
      newTaxi.set("currentGeoPoint", list[0].get("geoPoint"));
      newTaxi.save({
        success: function(obj){
          Materialize.toast(taxiID + ' has been added to the Hello Taxi database', 4000);

        },
        error: function(err){
          Materialize.toast(taxiID + ' could not be added to the Hello Taxi database because ' + err, 4000);

        }
      });
    },
    error: function(err) {
      Materialize.toast(cityID + ' does not match any city in the Hello Taxi database', 4000);

    }
  });
  setTimeout(function () { dnutChart(); }, 1000);
}

//Function: Allows for the user to enter the primary key of a taxi to be deleted
//from the database. The function takes the vehicleID as an input from the user
//and querys to find the exact taxi to be deleted. this taxi is then successfully
//deleted from the database. After this, the dnutChart function is called to
//aggregate over the database and display the number of taxi's of each type.
function delTaxi() {
  var taxiID = document.getElementById("delTaxiByID").value;
  var query = new CB.CloudQuery("Taxi");
  query.equalTo("vehicleID", parseInt(taxiID));
  query.find({
    success: function(list){
      list[0].delete({
        success : function(obj){
          Materialize.toast(taxiID + ' has been deleted from the Hello Taxi database', 4000);
        },
        error : function(err){
          Materialize.toast(taxiID + 'could not be deleted because ' + err);
        }
      });
    },
    error : function(err){
      Materialize.toast(taxiID + ' is not in the Hello Taxi database', 4000);

    }
  });
  setTimeout(function () { dnutChart(); }, 1000);
}

//Function: Uses the Charts.js opensource library as a primary source for data
//display. A Donut chart displays the results of a query that counts the number
//taxi's of each type within the Taxi table.
function dnutChart() {
  var query = new CB.CloudQuery("Taxi");
  query.include('Rate');
  query.setLimit(100000);
  query.find({
    success : function(list){
      var sedanCount=0;
      var crossCount=0;
      var vanCount=0;
      for (var i = 0; i < list.length; i++) {
        var car = list[i];
        var flag = car.get('flag');
        var rate = flag.get('id');
        if (rate == 'Bb6rNmzv') {
          sedanCount+=1;
        }
        else if(rate == '1hI2rJt0') {
          crossCount++;
        }
        else if(rate == 'pJhbWJ0S') {
          vanCount++;
        }
      }
      var ctx = document.getElementById("myChart");
      var myChart = new Chart(ctx, {
        type: 'doughnut',
        animation : {
          animateScale:true
        },
        data: {
          labels: ["Sedan", "Crossover", "Full-Size Van"],
          datasets: [{
            data: [sedanCount, crossCount, vanCount],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)'
            ],
            hoverBackgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56"
            ],
            borderWidth: 1
          }]
        }
      });
    },
    error : function(error){

    }
  });
}

//Function: Allows for administators to add new cities to the list of cities our
//service is available in. The administrator is asked to enter the name of the
//city, the address of the station and the number of chargers that the station
//contains. Using the Google Maps API, the physical address of the station is
//converted to a set of coordinates. A new CloudObject tuble is then inserted
//into the Cities table with the following attributes: cityName, Address,
//numChargers, and geoPoint.
function newCity() {
  var cityName = document.getElementById("cityName").value;
  var cityAddress = document.getElementById("cityAddress").value;
  var numChargers = document.getElementById("chargers").value;
  var lat = 0;
  var lng = 0;
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode( {'address' : cityAddress}, function(results, status) {
    if (status == 'OK') {
      lat = results[0].geometry.location.lat();
      lng = results[0].geometry.location.lng();
      var geopoint = new CB.CloudGeoPoint(lng, lat);
      var obj = new CB.CloudObject("Cities");
      obj.set("cityName", cityName);
      obj.set("Address", cityAddress);
      obj.set("numChargers", numChargers);
      obj.set("geoPoint", geopoint);
      obj.save({
        success: function(obj){
          Materialize.toast(cityName + ' has been added to the Hello Taxi database', 4000);
        },
        error: function(err){
          Materialize.toast(cityName + ' could not be added to the Hello Taxi database :' + err, 4000);

        }
      });
    }
    else {
      console.log("Error" + status);
    }
  });
}

//Function: Queries for all the tuples in the Payments table that limit the
//search to sets of 7 items each and determines which set to return; then
//displaying them by parsing the objects returned in an array into HTML code
//that is inserted as tuples in a displayed table. Displayed items in the viewable
//table: Username, Transaction Number, Rate, and Fare.
function loadTransactions() {
  var page = pageNumbers["transaction"];
  document.getElementById("transactionPageNumber").innerHTML = page;
  var query = new CB.CloudQuery("Payments");
  query.include("memberID");
  query.paginate(page, 7, {
    success: function(objectsList, count, totalPages){
      var htmlInner = "";
      for (var i = 0; i < objectsList.length; i++) {
        var transaction = objectsList[i];
        var transNumber = transaction.get("transactionID");
        var user = transaction.get("memberID");
        var userName = user.get("username");
        var rate = transaction.get("Rate");
        var fare = transaction.get("Fare");
        htmlInner += "<tr><td>" + transNumber.toString() + "</td>";
        htmlInner += "<td>" + userName.toString() + "</td>";
        htmlInner += "<td>" + rate.toString() + "</td>";
        htmlInner += "<td>" + fare.toString() + "</td></tr>";
        //console.log(htmlInner);
      }
      document.getElementById("transactionTable").innerHTML   = htmlInner;
    },
    error: function(err){

    }
  });
}

//Function: Queries for all the tuples in the Logs table that limit the
//search to sets of 7 items each and determines which set to return; then
//displaying them by parsing the objects returned in an array into HTML code
//that is inserted as tuples in a displayed table. Displayed items in the viewable
//table: Username, Taxi Number, Transaction Number, Destintion, and Distance.
function loadRecords() {
  var page = pageNumbers["record"];
  document.getElementById("recordPageNumber").innerHTML = page;
  var query = new CB.CloudQuery("Logs");
  query.include("memberID");
  query.include("vehicleID");
  query.paginate(page, 10, {
    success: function(objectsList, count, totalPages){
      var htmlInner = "";
      for (var i = 0; i < objectsList.length; i++) {
        var log = objectsList[i];
        var user = log.get("memberID");
        var username = user.get("username");
        var taxi = log.get("vehicleID");
        var taxiNumber = taxi.get("vehicleID");
        var transNumber = log.get("TransactionID");
        var destination = log.get("locationDropOff");
        var distance = log.get("distance");
        htmlInner += "<tr><td>" + username.toString() + "</td>";
        htmlInner += "<td>" + taxiNumber.toString() + "</td>";
        htmlInner += "<td>" + transNumber.toString() + "</td>";
        htmlInner += "<td>" + destination.toString() + "</td>";
        htmlInner += "<td>" + distance.toString() + "</td></tr>";
      }
      document.getElementById("recordTable").innerHTML = htmlInner;
    },
    error: function(err){

    }
  });
}

//Function: Gets the value from the search bar and initiates 4 new queries in
//the payments table. Query1 will include the memberID and will be used whenever
//the searchQuery is equal to the memberID. Queries 2,3,4 will search for equal
//values in the transactionID, Rate, and Fare columns respectively. An or query
//will be used that will determine if any of those queries are true and the
//tuples that match any queries will be returned. The returned values from
//either query will be an array of CloudObject tuples which will be parsed into
//HTML code that will then be inserted into the HTML as tuples in the displayed
//table.
function search() {
  var searchQuery = document.getElementById("searchBox").value;
  var query1 = new CB.CloudQuery("Payments");
  var query2 = new CB.CloudQuery("Payments");
  var query3 = new CB.CloudQuery("Payments");
  var query4 = new CB.CloudQuery("Payments");
  query1.include("memberID");
  query1.setLimit(10000000);
  query1.find({
    success: function(list) {
      var htmlInner = "";
      for (var i = 0; i <  list.length; i++) {
        var transaction = list[i];
        var transNumber = transaction.get("transactionID");
        var user = list[i].get("memberID");
        var username = user.get("username");
        var rate = transaction.get("Rate");
        var fare = transaction.get("Fare");
        if(username == searchQuery) {
          htmlInner += "<tr><td>" + transNumber.toString() + "</td>";
          htmlInner += "<td>" + username.toString() + "</td>";
          htmlInner += "<td>" + rate.toString() + "</td>";
          htmlInner += "<td>" + fare.toString() + "</td></tr>";
        }
        else {

        }
      }
      document.getElementById("transactionTable").innerHTML = htmlInner;
    },
    error: function(err) {

    }
  });
  query2.equalTo("transactionID", parseInt(searchQuery));
  query3.equalTo("Rate", parseFloat(searchQuery));
  query4.equalTo("Fare", parseFloat(searchQuery));
  var query = CB.CloudQuery.or([query2, query3, query4]);
  query.include("memberID")
  query.setLimit(100000);
  query.find({
    success: function(list) {
      if(list.length === 0) {
        //loadTransactions();
        //Materialize.toast(searchQuery + ' does not match any value in the Hello Taxi database. Reloading.', 4000);
      }
      else {
        var htmlInner = "";
        for (var i = 0; i <  list.length; i++) {
          var transaction = list[i];
          var transNumber = transaction.get("transactionID");
          var user = list[i].get("memberID");
          var username = user.get("username");
          var rate = transaction.get("Rate");
          var fare = transaction.get("Fare");
          htmlInner += "<tr><td>" + transNumber.toString() + "</td>";
          htmlInner += "<td>" + username.toString() + "</td>";
          htmlInner += "<td>" + rate.toString() + "</td>";
          htmlInner += "<td>" + fare.toString() + "</td></tr>";
        }
        document.getElementById("transactionTable").innerHTML = htmlInner;
      }
    },
    error: function(err) {

    }
  });
  document.getElementById("transactionPageNumber").innerHTML = "Query"  ;
}

//Function: Queries the entire Logs table to count how many logs have been stored
//and displays the number of times our service has been used since its completion.
function countServices() {
  var query = new CB.CloudQuery("Logs");
  query.setLimit(10000000);
  query.count({
    success: function(number) {
      document.getElementById("numTaxiServed").innerHTML += number;
    },
    error: function(err) {

    }
  });
}

function previousRecordPage() {
  pageNumbers["record"] +=-1;
  loadRecords();
}

function nextRecordPage() {
  pageNumbers["record"] +=1;
  loadRecords();
}

function previousTransactionPage() {
  pageNumbers["transaction"] +=-1;
  loadTransactions();
}

function nextTransactionPage() {
  pageNumbers["transaction"] +=1;
  loadTransactions();
}
var pageNumbers = {
  transaction: 1,
  record: 1
}
