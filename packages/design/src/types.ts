/** Vector design document model — professional tool semantics, SVG-backed. */

export interface Vec2 {
  x: number;
  y: number;
}

export type PathCommand =
  | { op: "M"; x: number; y: number }
  | { op: "L"; x: number; y: number }
  | { op: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { op: "Q"; x1: number; y1: number; x: number; y: number }
  | { op: "Z" };

export interface GradientStop {
  offset: number; // 0–1
  color: string;
}

export interface LinearGradient {
  id: string;
  type: "linear";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: GradientStop[];
}

export interface RadialGradient {
  id: string;
  type: "radial";
  cx: number;
  cy: number;
  r: number;
  stops: GradientStop[];
}

export type Paint = string | { gradientId: string };

export interface VectorNodeBase {
  id: string;
  name?: string;
  fill?: Paint;
  stroke?: Paint;
  strokeWidth?: number;
  opacity?: number;
  transform?: string;
}

export interface PathNode extends VectorNodeBase {
  kind: "path";
  commands: PathCommand[];
}

export interface RectNode extends VectorNodeBase {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
}

export interface EllipseNode extends VectorNodeBase {
  kind: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface TextNode extends VectorNodeBase {
  kind: "text";
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
}

export interface TextPathNode extends VectorNodeBase {
  kind: "textPath";
  href: string; // path id
  text: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface SymbolDef {
  id: string;
  name: string;
  viewBox: string;
  children: VectorNode[];
}

export interface UseNode extends VectorNodeBase {
  kind: "use";
  href: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export type VectorNode = PathNode | RectNode | EllipseNode | TextNode | TextPathNode | UseNode;

export interface DesignDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  nodes: VectorNode[];
  gradients: Array<LinearGradient | RadialGradient>;
  symbols: SymbolDef[];
  patterns: PatternDef[];
  createdAt: string;
  updatedAt: string;
}

export interface PatternDef {
  id: string;
  width: number;
  height: number;
  contentSvg: string; // inner markup
}
