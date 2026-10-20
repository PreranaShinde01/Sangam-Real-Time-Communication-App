export type WhiteboardTool =
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'arrow'
  | 'line'
  | 'text'
  | 'stickyNote';

export interface Point {
  x: number;
  y: number;
}

export interface WhiteboardElement {
  id: string;
  tool: WhiteboardTool;
  color: string;
  fillColor?: string;
  strokeWidth: number;
  opacity: number;
  points?: Point[]; // For pen, highlighter, arrow, line
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  page: number;
  createdBy: string;
  updatedAt: number;
}

export interface WhiteboardCursor {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  page: number;
}
