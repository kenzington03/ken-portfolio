import { createContext, useContext } from 'react';

/* What an app screen can ask of the phone it runs on: open another app,
   close itself (back to the home screen), switch Light / Dark, show the
   tutorial. AppSheet and the screens read it; IOS26Phone provides it. */
export const PhoneContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  openApp: () => {},
  close: () => {},
  showTutorial: () => {},
});

export const usePhone = () => useContext(PhoneContext);
