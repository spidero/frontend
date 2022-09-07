import 'leaflet/dist/leaflet.css'

import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
  TileLayer,
  ZoomControl,
  useMapEvents,
} from 'react-leaflet'
import { GpsFixed, GpsNotFixed } from '@material-ui/icons'
import { Typography, useMediaQuery } from '@material-ui/core'
import {
  activeLocationState,
  editModeState,
  isDrawerOpenState,
  searchResultsState,
} from '../state'
import { makeStyles, useTheme } from '@material-ui/core/styles'

import ContextMenu from './ContextMenu'
import Control from 'react-leaflet-custom-control'
import Export from './Export'
import { Icon } from 'leaflet'
import Legend from './Legend'
import PixiOverlay from 'react-leaflet-pixi-overlay'
import React from 'react'
import generateMarkerIcon from '../utils/generateMarkerIcon'
import history from '../history'
import { useRecoilState } from 'recoil'

const Map = ({
  center,
  zoom,
  bounds,
  isLoggedIn,
  userLocation,
  markers,
  locationAccuracy,
  getMarkers,
  setStoredPosition,
  activeTypes,
}) => {
  const [contextMenu, setContextMenu] = React.useState()
  const [previousBounds, setPreviousBounds] = React.useState()

  const mapRef = React.useRef()
  const initiated = !!mapRef?.current
  const [editMode] = useRecoilState(editModeState)
  const [, setSearchResults] = useRecoilState(searchResultsState)
  const [activeLocation, setActiveLocation] = useRecoilState(activeLocationState)
  const [isDrawerOpen] = useRecoilState(isDrawerOpenState)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isPhone = useMediaQuery(theme.breakpoints.down('xs'))
  const classes = useStyles(editMode)

  const currentZoom = mapRef?.current?._zoom || zoom
  const markerSize = currentZoom < 7
    ? 6
    : currentZoom < 10
      ? currentZoom - 1
      : currentZoom < 11
        ? 20
        : 32

  React.useEffect(() => {
    if (activeLocation?.location && !contextMenu && initiated && !isMobile) {
      const newZoom = currentZoom < 10 ? 11 : undefined
      mapRef.current.flyTo(activeLocation.location, newZoom)
    }
  }, [activeLocation])

  React.useEffect(() => {
    if (center && !activeLocation && initiated) {
      mapRef.current.flyTo(center)
    }
  }, [center])

  React.useEffect(() => {
    if (bounds && initiated && !activeLocation) {
      mapRef.current.flyToBounds(bounds)
    }
  }, [bounds, initiated])

  React.useEffect(() => {
    if (isMobile) {
      mapRef.current.invalidateSize()
      if (activeLocation?.location && initiated) {
        const newZoom = currentZoom < 11 ? 12 : undefined
        mapRef.current.flyTo(activeLocation.location, newZoom)
      }
    }
  }, [activeLocation, isDrawerOpen, isMobile])

  const handleLoadMapMarkers = async (newZoom, newBounds) => {
    // Check whether viewport really changed to prevent multiple requests for
    // the same data.
    if (JSON.stringify(newBounds) !== JSON.stringify(previousBounds)) {
      // Prevend getMarkers on zoom in, because the current ones can be used.
      // Load them anyway if this is the first call - previousBounds is not
      // defined, or when entering the details view on mobile - isMobile && isDrawerOpen.
      if (newZoom <= currentZoom || !previousBounds || (isMobile && isDrawerOpen)) {
        getMarkers(newBounds)
      }
      setStoredPosition({ bounds: newBounds, zoom: newZoom })
      setPreviousBounds(newBounds)
    }
  }

  React.useEffect(() => {
    // Refresh markers when active types change.
    const handleAsync = async () => {
      if (initiated) {
        const bounds = await mapRef.current.getBounds()
        getMarkers(bounds)
      }
    }
    handleAsync()
  }, [activeTypes])

  return (
    // Use wrapper to set offset to load markers that are on the edge of a screen.
    <div
      className={classes.offsetWrapper}
      style={isDrawerOpen && isMobile
        ? isPhone
          ? { height: theme.layout.mobileMiniMapHeight }
          : { marginLeft: theme.layout.locationTabWidth }
        : {}
      }
    >
      <MapContainer
        whenCreated={mapInstance => { mapRef.current = mapInstance }}
        className={classes.mapOffset}
        center={center}
        zoom={zoom}
        minZoom={5}
        maxZoom={18}
        maxBounds={[[-90, -180], [90, 180]]}
        zoomControl={false}
      >
        <MapEvents
          editMode={editMode}
          isLoggedIn={isLoggedIn}
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          activeLocation={activeLocation}
          setActiveLocation={setActiveLocation}
          handleLoadMapMarkers={handleLoadMapMarkers}
        />
        <TileLayer
          url='https://mapserver.mapy.cz/turist-m/{z}-{x}-{y}'
          attribution={`&copy; <a href="https://www.seznam.cz" target="_blank" rel="noopener">Seznam.cz, a.s.</a>, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, &copy; NASA`}
        />
        <PixiOverlay
          markers={markers.map(item => {
            const { location: { lat, lng }, id, type } = item
            return {
              id,
              customIcon: generateMarkerIcon(type, markerSize),
              iconId: `${type}_${markerSize}`,
              position: [lat, lng],
              onClick: () => {
                setSearchResults([])
                setActiveLocation(item)
                history.push(`/location/${item.id}`)
                setContextMenu(null)
              },
            }
          }) || []}
        />
        {activeLocation &&
          <Marker
            icon={new Icon({
              iconUrl: '/active-location.svg',
              iconSize: [40, 40],
              iconAnchor: [20, 40],
            })}
            zIndexOffset={1100}
            position={activeLocation.location}
            draggable={editMode}
            eventHandlers={{
              moveend: e => {
                if (editMode) {
                  setActiveLocation({
                    ...activeLocation,
                    location: e.target.getLatLng(),
                  })
                }
              },
            }}
          />
        }
        {activeLocation && contextMenu &&
          <Popup
            position={activeLocation.location}
            closeButton={false}
            className={classes.popup}
          >
            <ContextMenu addMarker={() => {
              setContextMenu(null)
              history.push('/location/new')
              mapRef.current.setView(activeLocation.location)
            }} />
          </Popup>
        }
        {userLocation &&
          <>
            {locationAccuracy && locationAccuracy > 30 &&
              <Circle
                center={userLocation}
                radius={locationAccuracy}
              />
            }
            <Marker
              icon={new Icon({
                iconUrl: '/current-location.svg',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
              zIndexOffset={1000}
              position={userLocation}
            />
          </>
        }
        {(!isDrawerOpen || !isPhone) &&
          <>
            <ZoomControl position='topright' />
            <Control position='topright'>
              <a
                className={classes.customControl}
                onClick={() => userLocation &&
                  mapRef.current.flyTo(userLocation, 14)
                }
                disabled={!userLocation}
              >
                {userLocation
                  ? <GpsFixed className={classes.customControlIcon} />
                  : <GpsNotFixed className={classes.customControlIcon} />
                }
              </a>
            </Control>
            {!editMode &&
              <Control position='topright' className='leaflet-bar'>
                <Export markers={markers} className={classes.customControl} />
              </Control>
            }
          </>
        }
        <Control position='bottomright'>
          {userLocation && (!isDrawerOpen || !isPhone) &&
            <Typography
              component='div'
              variant='caption'
              className={classes.userLocation}
            >Dokładność GPS: {Math.round(locationAccuracy)} m</Typography>
          }
        </Control>
        <ScaleControl position='bottomright' imperial={false} />
        {!isMobile && !editMode &&
          <Control position='topleft'>
            <Legend boxed />
          </Control>
        }
      </MapContainer>
    </div>
  )
}

Map.defaultProps = {
  center: [50.39805, 16.844417], // The area of Polish mountains.
  zoom: 7,
}


const MapEvents = ({
  editMode,
  isLoggedIn,
  contextMenu,
  setContextMenu,
  activeLocation,
  setActiveLocation,
  handleLoadMapMarkers,
}) => {
  useMapEvents({
    moveend: async e => {
      const bounds = await e.target.getBounds()
      handleLoadMapMarkers(e.sourceTarget._zoom, bounds)
    },
    contextmenu: e => {
      if (!editMode) {
        if (isLoggedIn) {
          setContextMenu(!contextMenu)
          setActiveLocation(contextMenu ? null : { location: e.latlng })
        }
        history.push('/')
      }
    },
    click: e => {
      if (contextMenu) {
        // If context menu is opened, close it.
        setContextMenu(false)
        setActiveLocation(null)
      } else if (editMode && isLoggedIn && !activeLocation) {
        // Add location by pinning on map mode.
        setActiveLocation({ location: e.latlng })
        history.push('/location/new')
      }
    },
  })
  return null
}


const useStyles = makeStyles(theme => ({
  offsetWrapper: {
    flexGrow: 1,
    position: 'relative',
  },
  // Map offset to load markers that are on the edge of a screen.
  mapOffset: {
    position: 'absolute',
    top: 0,
    left: theme.spacing(-2),
    bottom: theme.spacing(-4),
    right: theme.spacing(-2),
    // Offset must be compensed on controls.
    '& .leaflet-right': {
      right: theme.spacing(2),
    },
    '& .leaflet-bottom': {
      bottom: theme.spacing(4),
    },
    '& .leaflet-left': {
      left: theme.spacing(2),
    },
    // Add light shadow to all markers.
    '& .leaflet-marker-icon': {
      filter: 'drop-shadow(0 0 1px rgb(0,0,0))',
    },
    '& .leaflet-pixi-overlay': {
      // Move PIXI markers on top of a current location marker.
      zIndex: 1000,
      // Hide PIXI overlay while being in edit mode.
      display: editMode => editMode ? 'none' : 'block',
    },
  },
  woodboardCluster: {
    backgroundColor: 'transparent',
    backgroundImage: 'url(/woodboard.svg)',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    display: 'flex !important',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: '#522d19',
    filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.5))',
  },
  popup: {
    '& .leaflet-popup-content-wrapper': {
      backgroundColor: 'transparent',
      border: 'none',
      '&::after': {
        content: '""',
        display: 'block',
        position: 'absolute',
        width: 20,
        height: 1,
        left: 'calc(50% - 10px)',
        bottom: 0,
        backgroundColor: 'white',
      },
    },
    '& .leaflet-popup-content': {
      margin: 0,
      borderRadius: 0,
      border: 'none',
    },
  },
  customControl: {
    display: 'flex !important',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    '&[disabled]': {
      pointerEvents: 'none',
      opacity: 0.33,
    },
  },
  customControlIcon: {
    fontSize: 18,
  },
  userLocation: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    padding: '0 2px',
    fontSize: 11,
  },
}))

export default Map
