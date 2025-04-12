var urlToGet = 'http://gowdpk.ga/api/logins/check?user=' + usersName + '&pass=' + usersPassword;

fetch(urlToGet)
.then(response => {
  return response.json();
})
.then(data => {
  if (data == "Success") {
    // User has logged in
  }
  else {
     alert("Account already exists");
  }
})
var urlToGet = 'http://gowdpk.ga/api/logins/add?user=' + usersName + '&pass=' + usersPassword;

fetch(urlToGet)
.then(response => {
  return response.json();
})
.then(data => {
  if (data == "Accepted, welcome to GoWDPK!") {
    // User has signed up
  }
  else {
     alert("Account already exists");
  }
})