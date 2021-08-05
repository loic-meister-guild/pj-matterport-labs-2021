import { makeStyles } from '@material-ui/styles';
import React from 'react';

interface Props {
  parameters: string;
}

const useStyles = makeStyles({
  root: {
    border: 0,
    borderRadius: 3,
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    color: 'white',
    height: '100vh',
    width: '100vw',
  },
});

export function BundleIframe(props: Props) {
  const classes = useStyles(props);
  return (
    <iframe
      className={classes.root}
      id='sdk-iframe'
      src= {`./bundle/showcase.html?${props.parameters}`}
      allow='xr-spatial-tracking'
      allowFullScreen
    ></iframe>
  )
}
