export const enum PortsColor {
  DARK_GREEN = '#66BB6A',
  GREEN = '#66BB6A',
  ORANGE = 'orange',
  YELLOW = '#FFCA28',
  RED = '#EF5350',
  BLUE = '#42A5F5'
}


export function getColor(color: string): PortsColor {
  switch (color) {
    case 'dark-green':
      return PortsColor.DARK_GREEN;
    case 'green':
      return PortsColor.GREEN;
    case 'orange':
      return PortsColor.ORANGE;
    case 'yellow':
      return PortsColor.YELLOW;
    case 'red':
      return PortsColor.RED;
    default:
      return PortsColor.RED;
  }
}

