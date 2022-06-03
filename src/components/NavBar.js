import React from 'react'
import { AppBar, Toolbar, Typography, Avatar, Hidden } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { ArrowDropDown, Menu } from '@material-ui/icons'
import Form from 'react-form-component-mui'
import classNames from 'classnames'
import { useRecoilState } from 'recoil'
import Dropdown from './Dropdown'
import Logo from './Logo'
import SearchInput from './SearchInput'
import Loader from './Loader'
import Version from './Version'
import useLanguage from '../utils/useLanguage'
import { isDrawerOpenState } from '../state'


const NavBar = ({
  user,
  links,
  isLoggedIn,
  onSearch,
  searchLoading,
  authLoading,
  language,
  languages,
  setLanguage,
}) => {
  const classes = useStyles()
  const [isDrawerOpen] = useRecoilState(isDrawerOpenState)
  const { translations } = useLanguage()

  return (
    <AppBar position='relative' className={classNames(classes.root, {
      [classes.hideOnMobile]: isDrawerOpen,
    })}>
      <Toolbar>
        <Logo className={classes.logo} />
        <Form
          fields={['phrase']}
          onChange={fields => onSearch(fields.phrase)}
          runOnChangeInitially
          className={classes.search}
        >
          <SearchInput
            name='phrase'
            placeholder={translations.search}
            size='small'
            loading={searchLoading}
          />
        </Form>
        <div className={classes.version}>
          <Hidden smDown><Version /></Hidden>
        </div>
        {!authLoading && !isLoggedIn &&
          <Dropdown
            items={languages.map(lang => ({
              label: lang.toUpperCase(),
              callback: () => setLanguage(lang),
            }))}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >{language ? language.toUpperCase() : ''}</Dropdown>
        }
        {authLoading
          ? <Loader />
          : <Dropdown items={links}>
            {isLoggedIn
              ? <>
                <Avatar alt={user.name} src={user.picture}>
                  {!user.picture && `${user.given_name.charAt(0)}${user.family_name.charAt(0)}`}
                </Avatar>
                <Typography className={classes.name}>{user.name && user.name}</Typography>
                <ArrowDropDown />
              </>
              : <Menu />
            }
          </Dropdown>
        }
      </Toolbar>
    </AppBar>
  )
}


const useStyles = makeStyles(theme => ({
  root: {
    zIndex: theme.zIndex.drawer + 1,
  },
  hideOnMobile: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  logo: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  search: {
    [theme.breakpoints.down('xs')]: {
      width: 202,
    },
  },
  name: {
    marginLeft: theme.spacing(1),
    textTransform: 'none',
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  version: {
    flexGrow: 1,
    marginLeft: theme.spacing(1),
    lineHeight: 'normal',
    color: theme.palette.grey[500],
  },
}))

export default NavBar
