let restaurants,
  neighborhoods,
  cuisines;
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap1(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  ((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach((neighborhood) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach((cuisine) => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap1 = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiZnJhbmNpc2Nvamd0eiIsImEiOiJjamlzOHRncjEwbHU4M3ByeTdpenN5M3YwIn0.y1U7z4RQa0J58bhLtiYlqg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
* Clear current restaurants, their HTML and remove their map markers.
*/
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant) => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  const pictureElement = document.createElement('picture');
  const webPSource = document.createElement('source');
  const jpgSource = document.createElement('source');

  
  //me quede aqui--Tengo que trabajar en sizes 
  // solo 1x displays


  image.className = 'restaurant-img';
  image.className = 'lazyload';
  image.setAttribute('data-sizes', 'auto');
  image.alt = `${restaurant.name} restaurant, ${restaurant.photo_description}`;
  // image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));

  const restImg = DBHelper.imageUrlForRestaurant(restaurant).slice(0, -4);
  const imgSizes = '(max-width: 559px) calc(100vw - 4rem - 4px), (min-width: 560px) and (max-width: 1023px) calc(0.5 * 100vw - 5rem - 2px), (min-width: 1023px) calc(0.333 * 100vw - 5rem - 2px), calc(100vw - 6rem - 2px)';
  
  webPSource.setAttribute('data-srcset', `${restImg}_300.webp 300w, ${restImg}_400.webp 400w, ${restImg}_600.webp 600w, ${restImg}_800.webp 800w`);
  // webPSource.srcset = `${restImg}_300.webp 300w, ${restImg}_400.webp 400w, ${restImg}_600.webp 600w, ${restImg}_800.webp 800w`;
  webPSource.type = 'image/webp';
  webPSource.sizes = imgSizes;

  jpgSource.setAttribute('data-srcset', `${restImg}_400.jpg 400w, ${restImg}_600.jpg 600w, ${restImg}_800.jpg 800w`);
  // jpgSource.srcset = `${restImg}_400.jpg 400w, ${restImg}_600.jpg 600w, ${restImg}_800.jpg 800w`;
  jpgSource.type = 'image/jpg';
  jpgSource.sizes = imgSizes;

  pictureElement.append(webPSource);
  pictureElement.append(jpgSource);
  pictureElement.append(image);
  li.append(pictureElement);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'Restaurant details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach((restaurant) => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
}; 

function notifySWUpdates(reg) {
  console.log('There is a new Service Worker available');
  // create button
  const buttonSW = document.createElement('button');
  buttonSW.classList.add('sw-button');
  buttonSW.innerHTML = 'Update Available';
  // append button
  const docBody = document.getElementsByTagName('body')[0];
  docBody.appendChild(buttonSW);
  // onclick, post message
  buttonSW.addEventListener('click', () => {
    reg.postMessage({ activate: 'true' });
  });
}

function trackSWStates(reg) {
  reg.addEventListener('statechange', () => {
    if (this.state == 'installed') {
      notifySWUpdates(reg);
    }
  });
}

/**
 * This function registers the service worker
*/
function registerServiceWorker() {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    // refers to the SW that controls this page
    if (!navigator.serviceWorker.controller) {
      // page didn't load using a SW
      // loaded from the network
      return;
    }

    if (reg.waiting) {
      // there's an update ready!
      notifySWUpdates(reg.waiting);
    }

    if (reg.installing) {
      // there's an update in progress
      trackSWStates(reg.installing);
    }

    reg.addEventListener('updatefound', () => {
      trackSWStates(reg.installing);
    });

    let reloading;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      window.location.reload();
      reloading = true;
    });
  }).catch((err) => {
    console.log('SW failed: ', err);
  });
}

/**
 * Add service worker.
 */
//registerServiceWorker();
