import * as Neuroglancer from 'neuroglancer/viewer'; 
import {DisplayContext} from 'neuroglancer/display_context';

export class Viewer extends Neuroglancer.Viewer {

  constructor(public display: DisplayContext) {
    super(display); 

    this.layout.defaultSpecification = 'xy';
    this.layout.reset();
    
    this.makeNavUI();
    this.makeSideNav();
  }

  private makeNavUI() {
    let {display} = this;

    let topNav = document.createElement('div');
    topNav.setAttribute('id', 'top-nav');
    topNav.setAttribute('role', 'navigation');

    let navContainer = document.createElement('div');
    navContainer.setAttribute('class', 'wrap group');

    let logoLink = document.createElement('a');
    logoLink.setAttribute('href', '/');
    let logoText = document.createElement('div');
    logoText.setAttribute('id', 'logo');
    logoText.innerText = 'Neurodata';

    let logoTextInner = document.createElement('span');
    logoTextInner.setAttribute('id', 'vizlogo');
    logoTextInner.innerText = 'viz';

    logoText.appendChild(logoTextInner);
    logoLink.appendChild(logoText);
    navContainer.appendChild(logoLink);
    topNav.appendChild(navContainer);

    let navLinks = document.createElement('ul');

    let browseLinkContainer = document.createElement('li');
    browseLinkContainer.setAttribute('class', 'desk');
    let browseLink = document.createElement('a');
    browseLink.setAttribute('href', 'javascript:void(0)');
    browseLink.innerText = 'Browse';
    browseLinkContainer.appendChild(browseLink); 

    let loginLinkContainer = document.createElement('li');
    loginLinkContainer.setAttribute('class', 'desk');
    let loginLink = document.createElement('a');
    loginLink.setAttribute('href', 'javascript:void(0)');
    loginLink.innerText = 'Login';
    loginLinkContainer.appendChild(loginLink); 

    let sideNavButtonContainer = document.createElement('li');
    let sideNavLink = document.createElement('a');
    sideNavLink.setAttribute('href', 'javascript:void(0)');
    sideNavLink.setAttribute('class', 'menu');
    // TODO: toggle using viewer specific code 
    // also probably move this to nav panel... 
    sideNavLink.setAttribute('onclick', 'openNav()');
    let sideNavButton = document.createElement('i');
    sideNavButton.setAttribute('class', 'fa fa-bars');
    sideNavLink.appendChild(sideNavButton);
    sideNavButtonContainer.appendChild(sideNavLink); 

    navLinks.appendChild(browseLinkContainer);
    navLinks.appendChild(loginLinkContainer);
    navLinks.appendChild(sideNavButtonContainer);

    topNav.appendChild(navLinks);

    let {container} = display;
    container.appendChild(topNav);
  }

  makeSideNav() {
    let {display} = this;

    let sideNav = document.createElement('div');
    sideNav.setAttribute('id', 'sidenav');

    let closeButton = document.createElement('div');
    closeButton.setAttribute('class', 'closebtn');
    
    let closeButtonLink = document.createElement('a');
    closeButtonLink.setAttribute('href','javascript:void(0)');
    closeButtonLink.setAttribute('onclick','closeNav()');
    
    let closeButtonIcon = document.createElement('i');
    closeButtonIcon.setAttribute('class', 'fa fa-close');

    closeButtonLink.appendChild(closeButtonIcon); 
    closeButton.appendChild(closeButtonLink); 

    sideNav.appendChild(closeButton);

    let metadataLink = document.createElement('a');
    metadataLink.setAttribute('href', 'javascript:void(0)');
    metadataLink.innerText = 'Metadata';

    sideNav.appendChild(metadataLink);

    let {container} = display;
    container.appendChild(sideNav);

  }
}