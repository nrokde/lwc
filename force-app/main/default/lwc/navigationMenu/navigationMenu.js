import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import HAMBURGER_ICON from '@salesforce/resourceUrl/hamburgerIcon';
import X_ICON from '@salesforce/resourceUrl/xIcon';
import getLogoutUrl from '@salesforce/apex/applauncher.IdentityHeaderController.getLogoutUrl';
import getLoginUrl from '@salesforce/apex/NavigationController.getLoginUrl';
import getNavigationMenuItems from '@salesforce/apex/NavigationController.getNavigationMenuItems';
import isGuestUser from '@salesforce/user/isGuest';
import basePath from '@salesforce/community/basePath';
import ToastContainer from 'lightning/toastContainer';

/**
 * This is a custom LWC navigation menu component.
 * Make sure the Guest user profile has access to the NavigationMenuItemsController apex class.
 */
export default class NavigationMenu extends NavigationMixin(LightningElement) {
    @api menuName;

    error;
    href = basePath;
    isLoaded;
    menuItems = [];
    publishedState;
    showHamburgerMenu;
    loginUrl = '#';
    logoutUrl = '#';

    hamburgerIcon = HAMBURGER_ICON;
    xIcon = X_ICON;

    connectedCallback() {
        const toastContainer = ToastContainer.instance();
        toastContainer.maxShown = 3;
        toastContainer.toastPosition = 'top-right';
        // Get login and logout URLs in non-blocking async calls
        getLoginUrl()
            .then((url) => {
                this.loginUrl = url;
            })
            .catch((error) => {
                console.error(
                    `Failed to retrieve log in URL: ${JSON.stringify(error)}`
                );
            });
        getLogoutUrl()
            .then((url) => {
                this.logoutUrl = url;
            })
            .catch((error) => {
                console.error(
                    `Failed to retrieve log out URL: ${JSON.stringify(error)}`
                );
            });
    }

    @wire(getNavigationMenuItems, {
        menuName: '$menuName',
        publishedState: '$publishedState'
    })
    wiredMenuItems({ error, data }) {
        if (data && !this.isLoaded) {
            this.menuItems = data
                .map((item, index) => {
                    return {
                        target: item.Target,
                        id: index,
                        label: item.Label,
                        defaultListViewId: item.DefaultListViewId,
                        type: item.Type,
                        accessRestriction: item.AccessRestriction
                    };
                })
                .filter((item) => {
                    // Only show "Public" items if guest user
                    return (
                        item.accessRestriction === 'None' ||
                        (item.accessRestriction === 'LoginRequired' &&
                            !isGuestUser)
                    );
                });
            this.error = undefined;
            this.isLoaded = true;
        } else if (error) {
            this.error = error;
            this.menuItems = [];
            this.isLoaded = true;
            console.error(`Navigation menu error: ${JSON.stringify(error)}`);
        }
    }

    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        const app =
            currentPageReference &&
            currentPageReference.state &&
            currentPageReference.state.app;
        if (app === 'commeditor') {
            this.publishedState = 'Draft';
        } else {
            this.publishedState = 'Live';
        }
    }

    handleHamburgerMenuToggle(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        if (this.showHamburgerMenu) {
            this.showHamburgerMenu = false;
        } else {
            this.showHamburgerMenu = true;
        }
    }

    get hideHamburgerMenu() {
        return !this.showHamburgerMenu;
    }

    get showLoginLink() {
        return isGuestUser;
    }
}
