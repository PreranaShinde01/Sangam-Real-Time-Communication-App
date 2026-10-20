import React, { useRef, useState, useEffect } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Type,
  StickyNote,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Lock,
  Unlock,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { WhiteboardElement, WhiteboardTool, Point } from '@sangam/shared';

interface WhiteboardPanelProps {
  onSyncElements: (elements: WhiteboardElement[], page: number) => void;
  onClearBoard: (page: number) => void;
  onClose: () => void;
}

const COLORS = ['#FFFFFF', '#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
const STROKE_WIDTHS = [2, 4, 8, 14];

export const WhiteboardPanel: React.FC<WhiteboardPanelProps> = ({
  onSyncElements,
  onClearBoard,
  onClose,
}) => {
  const { roomState, myParticipant } = useRoomStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [history, setHistory] = useState<WhiteboardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([]);

  const [tool, setTool] = useState<WhiteboardTool>('pen');
  const [color, setColor] = useState<string>('#4F46E5');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  const isViewOnly = !roomState?.settings.allowWhiteboard && !myParticipant?.isHost;

  // Redraw canvas whenever elements or page changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset and clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter elements for current page
    const pageElements = elements.filter((el) => el.page === currentPage);

    pageElements.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.fillColor || el.color;
      ctx.lineWidth = el.strokeWidth;
      ctx.globalAlpha = el.opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if ((el.tool === 'pen' || el.tool === 'highlighter') && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.tool === 'rectangle' && el.width && el.height) {
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.tool === 'circle' && el.width) {
        ctx.beginPath();
        const r = Math.abs(el.width / 2);
        ctx.arc(el.x + r, el.y + r, r, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (el.tool === 'arrow' && el.points && el.points.length >= 2) {
        const from = el.points[0];
        const to = el.points[el.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - 15 * Math.cos(angle - Math.PI / 6), to.y - 15 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - 15 * Math.cos(angle + Math.PI / 6), to.y - 15 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (el.tool === 'text' && el.text) {
        ctx.font = `${el.fontSize || 18}px sans-serif`;
        ctx.fillText(el.text, el.x, el.y);
      } else if (el.tool === 'stickyNote' && el.text) {
        // Sticky Note Box
        ctx.fillStyle = '#FEF08A'; // yellow note
        ctx.fillRect(el.x, el.y, 140, 100);
        ctx.strokeStyle = '#FDE047';
        ctx.strokeRect(el.x, el.y, 140, 100);

        ctx.fillStyle = '#1E293B';
        ctx.font = '13px sans-serif';
        ctx.fillText(el.text, el.x + 10, el.y + 25, 120);
      }

      ctx.restore();
    });
  }, [elements, currentPage]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isViewOnly) return;
    const pt = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPoint(pt);
    setCurrentPoints([pt]);

    if (tool === 'text') {
      const text = prompt('Enter text for whiteboard:');
      if (text) {
        const newEl: WhiteboardElement = {
          id: `${Date.now()}`,
          tool: 'text',
          color,
          strokeWidth,
          opacity: 1,
          x: pt.x,
          y: pt.y,
          text,
          fontSize: 20,
          page: currentPage,
          createdBy: myParticipant?.name || 'User',
          updatedAt: Date.now(),
        };
        commitElement(newEl);
      }
      setIsDrawing(false);
    } else if (tool === 'stickyNote') {
      const text = prompt('Sticky note message:');
      if (text) {
        const newEl: WhiteboardElement = {
          id: `${Date.now()}`,
          tool: 'stickyNote',
          color: '#FEF08A',
          strokeWidth: 1,
          opacity: 0.95,
          x: pt.x,
          y: pt.y,
          text,
          page: currentPage,
          createdBy: myParticipant?.name || 'User',
          updatedAt: Date.now(),
        };
        commitElement(newEl);
      }
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isViewOnly) return;
    const pt = getCanvasCoordinates(e);

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      setCurrentPoints((prev) => [...prev, pt]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isViewOnly || !startPoint) {
      setIsDrawing(false);
      return;
    }

    const endPt = getCanvasCoordinates(e);
    let newEl: WhiteboardElement | null = null;

    if (tool === 'pen' || tool === 'highlighter') {
      newEl = {
        id: `${Date.now()}`,
        tool,
        color: tool === 'highlighter' ? color : color,
        strokeWidth: tool === 'highlighter' ? strokeWidth * 3 : strokeWidth,
        opacity: tool === 'highlighter' ? 0.35 : 1,
        points: currentPoints,
        x: startPoint.x,
        y: startPoint.y,
        page: currentPage,
        createdBy: myParticipant?.name || 'User',
        updatedAt: Date.now(),
      };
    } else if (tool === 'rectangle') {
      newEl = {
        id: `${Date.now()}`,
        tool: 'rectangle',
        color,
        strokeWidth,
        opacity: 1,
        x: Math.min(startPoint.x, endPt.x),
        y: Math.min(startPoint.y, endPt.y),
        width: Math.abs(endPt.x - startPoint.x),
        height: Math.abs(endPt.y - startPoint.y),
        page: currentPage,
        createdBy: myParticipant?.name || 'User',
        updatedAt: Date.now(),
      };
    } else if (tool === 'circle') {
      const radius = Math.hypot(endPt.x - startPoint.x, endPt.y - startPoint.y);
      newEl = {
        id: `${Date.now()}`,
        tool: 'circle',
        color,
        strokeWidth,
        opacity: 1,
        x: startPoint.x - radius,
        y: startPoint.y - radius,
        width: radius * 2,
        height: radius * 2,
        page: currentPage,
        createdBy: myParticipant?.name || 'User',
        updatedAt: Date.now(),
      };
    } else if (tool === 'arrow') {
      newEl = {
        id: `${Date.now()}`,
        tool: 'arrow',
        color,
        strokeWidth,
        opacity: 1,
        points: [startPoint, endPt],
        x: startPoint.x,
        y: startPoint.y,
        page: currentPage,
        createdBy: myParticipant?.name || 'User',
        updatedAt: Date.now(),
      };
    }

    if (newEl) {
      commitElement(newEl);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoints([]);
  };

  const commitElement = (newEl: WhiteboardElement) => {
    const updated = [...elements, newEl];
    setHistory((h) => [...h, elements]);
    setRedoStack([]);
    setElements(updated);
    onSyncElements(updated, currentPage);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [...r, elements]);
    setHistory((h) => h.slice(0, -1));
    setElements(prev);
    onSyncElements(prev, currentPage);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [...h, elements]);
    setRedoStack((r) => r.slice(0, -1));
    setElements(next);
    onSyncElements(next, currentPage);
  };

  const handleClear = () => {
    if (confirm('Clear the entire board for all participants?')) {
      const remaining = elements.filter((el) => el.page !== currentPage);
      setHistory((h) => [...h, elements]);
      setElements(remaining);
      onClearBoard(currentPage);
    }
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `sangam-whiteboard-page${currentPage + 1}.png`;
    a.click();
  };

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col relative z-20 overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        {/* Drawing Tools */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setTool('pen')}
            title="Pen"
            className={`p-2 rounded-lg transition-colors ${
              tool === 'pen' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Pen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('highlighter')}
            title="Highlighter"
            className={`p-2 rounded-lg transition-colors ${
              tool === 'highlighter' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('rectangle')}
            title="Rectangle"
            className={`p-2 rounded-lg transition-colors ${
              tool === 'rectangle' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('circle')}
            title="Circle"
            className={`p-2 rounded-lg transition-colors ${
              tool === 'circle' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('arrow')}
            title="Arrow"
            className={`p-2 rounded-lg transition-colors ${
              tool === 'arrow' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('text')}
            title="Text"
            className={`p-2 rounded-lg transition-colors ${
              tool === 'text' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('stickyNote')}
            title="Sticky Note"
            className={`p-2 rounded-lg transition-colors ${
              tool === 'stickyNote' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <StickyNote className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2 border-l border-r border-slate-800">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full transition-transform ${
                color === c ? 'scale-125 ring-2 ring-brand-400' : 'hover:scale-110'
              }`}
            />
          ))}
        </div>

        {/* Undo/Redo & Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            title="Clear board"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPng}
            title="Export PNG"
            className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Page Selector */}
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-800 text-xs text-slate-300">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>Page {currentPage + 1}</span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1 rounded hover:bg-slate-800"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onClose}
            title="Close Whiteboard"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full h-full relative bg-slate-900 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full object-contain"
        />

        {/* View Only Warning Banner */}
        {isViewOnly && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1.5 shadow-xl">
            <Lock className="w-3.5 h-3.5" />
            <span>Whiteboard is locked in view-only mode by host</span>
          </div>
        )}
      </div>
    </div>
  );
};
