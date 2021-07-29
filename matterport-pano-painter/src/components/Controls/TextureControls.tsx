import './style/texture-controls.css';
import React, { Component } from 'react';
import classNames from 'classnames';

export interface ITextureSelectControls {
  onSelect(i: number): void;
}

export type TextureSettingsT = {
  urls: string[];
  selected: number;
};

type Props = {
  color: string;
  textureSettings: TextureSettingsT;
  textureSelectControls: ITextureSelectControls;
};

type State = {
  expanded: boolean;
};

export class TextureControls extends Component<Props, State> {
  private onHeaderClick: () => void;
  private colorSelectCallback: () => void;
  private generateSwatch: (url: string, i: number) => JSX.Element;
  private clickCallbacks: Array<() => void>;

  constructor(props: Props) {
    super(props);

    this.state = {
      expanded: true,
    };

    this.onHeaderClick = () => { this.setState((prevState) => ({
      expanded: !prevState.expanded,
    }))}

    this.colorSelectCallback = () => this.props.textureSelectControls.onSelect(-1);
    this.generateSwatch = (url: string, i: number) => this.createSwatchForUrl(url, i, this.clickCallbacks[i]);
    this.clickCallbacks = props.textureSettings.urls.map((_, i) => () => this.props.textureSelectControls.onSelect(i));
  }

  componentDidUpdate() {
    this.clickCallbacks = this.props.textureSettings.urls.map((_, i) => () => this.props.textureSelectControls.onSelect(i));
  }

  render() {
    return (
      <div
        className={classNames('texture-selector', {
          expanded: this.state.expanded,
        })}
        style={{ height: this.state.expanded ? this.calcDrawerHeight() : undefined}}
      >
        <div
          className={classNames('header')}
          onClick={this.onHeaderClick}
        >
          <div>
            <div
              className={classNames('icon', 'icon-chevron-down')}
              />
            Texture
          </div>
        </div>
        <div
          className={classNames('swatch-drawer')}
        >
          <ColorSwatch
            selected={this.props.textureSettings.selected === -1}
            color={this.props.color}
            onClick={this.colorSelectCallback}
          />
          {this.props.textureSettings.urls.map(this.generateSwatch)}
        </div>
      </div>
    );
  }

  private createSwatchForUrl(url: string, i: number, onClick: () => void): JSX.Element {
    return (
      <TextureSwatch
        key={i}
        selected={this.props.textureSettings.selected === i}
        textureSrc={url}
        onClick={onClick}
      />
    );
  }

  private calcDrawerHeight() {
    const nTexture = this.props.textureSettings.urls.length;
    // each swatch is 28px, padding between each is 8px, drawer top/bottom padding is 16px, header is 32px
    return ((nTexture + 1) * 28 + nTexture * 8 + 16 * 2 + 32) + 'px';
  }
}

class ColorSwatch extends Component<{ color: string; selected: boolean; onClick: () => void; }> {
  render() {
    return (
      <div
        className={classNames('swatch', {
          selected: this.props.selected,
        })}
        style={{ backgroundColor: this.props.color }}
        onClick={this.props.onClick}
      />
    )
  }
}

class TextureSwatch extends Component<{ textureSrc: string; selected: boolean; onClick: () => void; }> {
  render() {
    return (
      <div
        className={classNames('swatch', {
          selected: this.props.selected,
        })}
        style={{ backgroundImage: `url("${this.props.textureSrc}")` }}
        onClick={this.props.onClick}
      />
    );
  }
}
