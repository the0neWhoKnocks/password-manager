if (window.NEEDS_INITAL_SETUP) window.showConfigSetUp();
else if (window.utils.storage.get('userData')) window.showCredentials();
else window.showLogin();
