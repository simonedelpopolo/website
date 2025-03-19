(function(){

  // Get the header element
  const header = document.querySelector('.header');
  const main = document.querySelector('main');

  // Add a scroll event listener to the window
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.remove('position_relative');
      header.classList.add('position_fixed');
      header.classList.add('shrink');
      header.classList.add('hide');
      header.classList.remove('padding_regular');
      header.classList.add('padding_small');
      main.classList.add('move');
    } else {
      header.classList.remove('shrink');
      header.classList.remove('position_fixed');
      header.classList.add('position_relative');
      header.classList.remove('hide');
      header.classList.remove('padding_small');
      header.classList.add('padding_regular');
      main.classList.remove('move');
    }
  });

  // Get all the navigation links
  const links = document.querySelectorAll('#header nav ul li a');

  // Function to set the active link based on the current location
  function setActiveLink() {

    const current_anchor = window.location.hash; // Get the hash from the URL (e.g., #about)

    // Loop through the links to find a match
    links.forEach(link => {
      if(current_anchor !== '#') {
        if ( link.getAttribute( 'href' ) === current_anchor ) {
          link.classList.add( 'active' ) // Add active class to the matching link
        } else {
          link.classList.remove( 'active' ) // Remove active class from others
        }
      }
    });

    // remove the hash from the window.location if the current_anchor is === '#'
    if (!current_anchor || current_anchor === '#') {
      console.log(current_anchor);
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  }

  // Add event listeners to handle active state on click
  links.forEach(link => {
    link.addEventListener('click', () => {
      // Remove active class from all links
      links.forEach(link => link.classList.remove('active'));
      // Add active class to the clicked link
      link.classList.add('active');

    });
  });

  // Call setActiveLink on page load
  window.addEventListener('load', setActiveLink);

  // Optional: Handle hash changes dynamically (if navigating without reloading)
  window.addEventListener('hashchange', setActiveLink);
})();
