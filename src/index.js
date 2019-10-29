import React from 'react'
import ReactDOM from 'react-dom'
import { SnackbarProvider } from 'notistack'
import { FormThemeProvider } from 'react-standalone-form'
import App from './App'
import { Auth0Provider } from './auth0'
import * as serviceWorker from './serviceWorker'
import { CssBaseline } from '@material-ui/core'


ReactDOM.render(
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH_DOMAIN}
      client_id={process.env.REACT_APP_AUTH_CLIENT}
      redirect_uri={window.location.origin}
      responseType='token id_token'
      getTokenSilently
    >
      <FormThemeProvider>
        <CssBaseline />
        <App />
      </FormThemeProvider>
    </Auth0Provider>
  </SnackbarProvider>, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
