import { DefaultTheme, makeStyles } from '@material-ui/styles';


const backgroundColor = '#f5f4f3';
const darkFilter = 'invert(0%) sepia(100%) saturate(0%) hue-rotate(176deg) brightness(87%) contrast(106%)';
const darkBackgroundColor = '#222222';
const lightFilter = 'invert(99%) sepia(1%) saturate(5%) hue-rotate(329deg) brightness(105%) contrast(100%)';
const hoverBackgroundColor = '#ff3158';

export interface StyleProps{
  size: string;
  dark: boolean;
  selected: boolean;
  enabled: boolean;
  toggleImageColor: boolean;
}

export const useStyles = makeStyles<DefaultTheme, StyleProps>((theme) => ({
  selected: {
    transition: 'all 0.2s',
    backgroundColor: `${hoverBackgroundColor} !important`, // hack, not sure how to get backgroundColor to override button
  },
  container: {
    pointerEvents: 'none',
    boxSizing: 'border-box',
    '&:hover': {
      '& $button': {
        transition: 'all 0.2s',
        backgroundColor: hoverBackgroundColor,
      },
      '& $image': {
        transition: 'all 0.4s',
        filter: (props: StyleProps) => props.toggleImageColor ? ( props.dark ? darkFilter : lightFilter  ) : 'none',
      },
    },
    margin: '5px',
  },
  button: {
    width: ({size}) => size,
    height: ({size}) => size,
    borderRadius: '50%',
    backgroundColor: ({dark}) => dark ? darkBackgroundColor : backgroundColor,
    cursor: 'pointer',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    transition: 'all 0.2s ease-in',
    opacity: ({enabled}) => enabled ? 1 : 0.3,
  },  
  image: {
    color: '#000000',
    alignSelf: 'center',
    transition: 'all 0.2s ease-in',
    filter: () => 'none',
  },
}));