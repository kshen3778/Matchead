

angular.module('chart.js',[]);
var charts = angular.module('myModule',['chart.js']);
var app = angular.module('flapperNews', ['ui.router', 'myModule']);
//var chartApp = angular.module('myApp', ['chart.js']);

app.factory('auth', ['$http', '$window', function($http, $window){
  var auth = {};
  
  //save the login token into localStorage
  auth.saveToken = function(token){
    $window.localStorage['flapper-news-token'] = token;
  };
  
  //get token from localStorage
  auth.getToken = function(){
    return $window.localStorage['flapper-news-token'];
  };
  
  //check if user is logged in(token exists and isn't expired)
  auth.isLoggedIn = function(){
    var token = auth.getToken();
    if(token){ //check if token exists
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000; //check for expiration
    } else {
      return false; //user is logged out
    }
  };
  
  //return username of user that's logged in
  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.username;
    }
  };
  
  //register the user and save the token returned
  auth.register = function(user){
    console.log(user);
    return $http.post('/register', user).success(function(data){
      auth.saveToken(data.token);
      console.log(user);
    });
  };
  
  //login the user and save the token returned
  auth.logIn = function(user){
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };
  
  //logout by removing token from localStorage
  auth.logOut = function(){
    $window.localStorage.removeItem('flapper-news-token');
  };
  return auth;
}]);

//controls posts
app.controller('MainCtrl', [
    '$scope',
    'auth',
    function($scope, auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        
        
    }
]);

charts.controller('TextCtrl', [
    '$scope',
    'auth',
    '$http',
    function($scope, auth, $http){

        $scope.isLoggedIn = auth.isLoggedIn;
        
       /* $scope.testlabels =["Eating", "Drinking", "Sleeping", "Designing", "Coding", "Cycling", "Running"];

  $scope.testdata = [
    [65, 59, 90, 81, 56, 55, 40],
    [28, 48, 40, 19, 96, 27, 100]
  ];*/
        //console.log($scope.testdata);
        
        $scope.analyze = function(){
          console.log($scope.person);
          console.log($scope.company);
          
          
          $http.post('/analyze', {person: $scope.person, company: $scope.company}).then(function(data) {
            
            console.log(data);
            
           /* $scope.companySentiment = data.data.csent;
            $scope.companyPolitical = data.data.cpolitical;
            $scope.companyPersonality = data.data.cpersonality;
            
            $scope.personalSentiment = data.data.psent;
            $scope.personalPolitical = data.data.ppolitical;
            $scope.personalPersonality = data.data.ppersonality;*/
            
            $scope.labels =["Sentiment", "Political View", "Extraversion", "Openness", "Agreeableness", "Conscientiousness"];
            
            var largestValuePolitical = Math.max.apply(Math, data.data.cpolitical); //value of most dominant political view
            var dominantCompanyPolitical = data.data.cpolitical.indexOf(Math.max.apply(Math, data.data.cpolitical)); //index of largest value
            var personalPoliticalView = data.data.ppolitical[dominantCompanyPolitical]; //value of the person's political view of the company's political view
            $scope.series = [$scope.company, $scope.person];
            //
            // Define the data array
            //
            $scope.data = [
              [data.data.csent, largestValuePolitical, data.data.cpersonality[0], data.data.cpersonality[1], data.data.cpersonality[2], data.data.cpersonality[3]],
              [data.data.psent, personalPoliticalView, data.data.ppersonality[0], data.data.ppersonality[1], data.data.ppersonality[2], data.data.ppersonality[3]]
            ];
            /*console.log(0);
            $scope.data = [data.data.cpolitical[0], data.data.cpolitical[1], data.data.cpolitical[2], data.data.cpolitical[3]];
            console.log(1);
            $scope.data2 = [data.data.ppolitical[0], data.data.ppolitical[1], data.data.ppolitical[2], data.data.ppolitical[3]];
            console.log(2);*/
            
          });
        };
        
    }
]);

//will control a post's comments
app.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
function($scope, posts, post, auth){ //has access to posts factory
    $scope.post = post; //$scope.post two way binding to the frontend ng-repeat=post in posts
    $scope.isLoggedIn = auth.isLoggedIn;
    
    //add a comment to a post
    $scope.addComment = function(){
      if($scope.body === '') {
        return;
      }
      posts.addComment(post._id, {
        body: $scope.body,
        author: 'user',
      }).success(function(comment){
        $scope.post.comments.push(comment);
      });
      $scope.body = '';
    };
    
    //upvote a comment
    $scope.incrementUpvotes = function(comment){
      posts.upvoteComment(post, comment);
    };
    
}]);

//controller for navbar
app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  //expose methods from auth factory
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};
  
  //calls the register method in auth factory
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){ //if no errors, promise the user home
      $state.go('home');
    });
  };
  
  //calls the login method in auth factory
  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){ //if no errors, promise the user home
      $state.go('home');
    });
  };
}]);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider){

    //home state
    $stateProvider.state('home', {
      url: '/home',
      templateUrl: 'partials/home.html',
      controller: 'MainCtrl'
    });
    
    $stateProvider.state('texts', {
      url: '/texts',
      templateUrl: '/text.html',
      controller: 'TextCtrl'
      
    });

    
    //login state (accessible once logged in)
    $stateProvider.state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          //if logged in then proceed to home
          $state.go('home');
        }
      }]
    });
    
    //register state (accessible once logged in)
    $stateProvider.state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });

    $urlRouterProvider.otherwise('home');

}]);
