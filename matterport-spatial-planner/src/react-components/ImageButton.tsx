import React from 'react';
import { useStyles } from './ImageButton.styles';

// import { DefaultTheme, makeStyles } from '@material-ui/styles';

// const backgroundColor = '#f5f4f3';
// // const darkFilter = 'invert(0%) sepia(100%) saturate(0%) hue-rotate(176deg) brightness(87%) contrast(106%)';
// const darkBackgroundColor = '#222222';
// // const lightFilter = 'invert(99%) sepia(1%) saturate(5%) hue-rotate(329deg) brightness(105%) contrast(100%)';
// const hoverBackgroundColor = '#ff3158';

// const useStyles = makeStyles<DefaultTheme, Props>((theme) => ({
//   container: {
//     pointerEvents: 'none',
//     boxSizing: 'border-box',
//     '&:hover': {
//       '& $button': {
//         transition: 'all 0.2s',
//         backgroundColor: hoverBackgroundColor,
//       },
//       '& $image': {
//         backgroundColor: '#ff0000',
//         // filter: props.toggleImageColor ? ( props.dark ? darkFilter : lightFilter  ) : lightFilter,
//         transition: 'all 0.4s',
//         //filter: (props: Props) => props.toggleImageColor ? ( props.dark ? darkFilter : lightFilter  ) : lightFilter,
//       },
//     },
//     margin: '5px',
//   },
//   button: {
//     width: ({size}) => size,
//     height: ({size}) => size,
//     borderRadius: '50%',
//     backgroundColor: ({dark}) => dark ? darkBackgroundColor : backgroundColor,
//     cursor: 'pointer',
//     pointerEvents: 'auto',
//     boxSizing: 'border-box',
//     display: 'flex',
//     justifyContent: 'center',
//     transition: 'all 0.2s ease-in',
//   },
//   image: {
//     color: '#000000',
//     alignSelf: 'center',
//     // transition: 'all 0.2s ease-in',
//     filter: 'none',
//   },
// }));

interface Props {
  size: string;
  dark: boolean;
  enabled: boolean;
  selected: boolean;
  toggleImageColor: boolean;
  image: string;
  onButtonClicked?: () => void;
}

export function ImageButton(props: Props) {
  const classes = useStyles(props);

  const clickHandler = () => {
    if (props.enabled) {
      if (props.onButtonClicked) {
        props.onButtonClicked();
      }
    }
  };

  return (
    <div className={`${classes.container}}`} onClick={clickHandler}>
      <div className={`${classes.button} ${props.selected ? classes.selected : ''}`}>
        <img className={classes.image} src={props.image}></img>
      </div>
    </div>
  );
}

const defaultProps: Props = {
  image: '',
  dark: false,
  size: '41px',
  toggleImageColor: false,
  selected: false,
  enabled: true,
};

ImageButton.defaultProps = defaultProps;
