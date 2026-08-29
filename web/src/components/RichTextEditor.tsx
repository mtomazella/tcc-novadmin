import React from 'react'
import { Color } from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { Extension } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const AlignmentShortcutsExtension = Extension.create({
  name: 'alignmentShortcuts',
  addKeyboardShortcuts() {
    return {
      'Mod-l': () => this.editor.chain().setTextAlign('left').run(),
      'Mod-e': () => this.editor.chain().setTextAlign('center').run(),
      'Mod-r': () => this.editor.chain().setTextAlign('right').run(),
      'Mod-j': () => this.editor.chain().setTextAlign('justify').run(),
    }
  },
})

const COLOR_BY_CODE: Record<string, string> = {
  Digit1: '#1a1a1a',
  Digit2: '#7C3AED',
  Digit3: '#DC2626',
  Digit4: '#2563EB',
}

const ColorShortcutsExtension = Extension.create({
  name: 'colorShortcuts',
  onCreate() {
    const editor = this.editor
    const handleColorKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.shiftKey || event.altKey) return
      const color = COLOR_BY_CODE[event.code]
      if (!color) return
      event.preventDefault()
      editor.chain().setColor(color).run()
    }
    editor.view.dom.addEventListener('keydown', handleColorKeyDown)
    editor.on('destroy', () =>
      editor.view.dom.removeEventListener('keydown', handleColorKeyDown),
    )
  },
})

const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl+B', label: 'Negrito' },
  { key: 'Ctrl+I', label: 'Itálico' },
  { key: 'Ctrl+U', label: 'Sublinhado' },
  { key: 'Ctrl+L', label: 'Alinhar à esquerda' },
  { key: 'Ctrl+E', label: 'Centralizar' },
  { key: 'Ctrl+R', label: 'Alinhar à direita' },
  { key: 'Ctrl+J', label: 'Justificar' },
  { key: 'Ctrl+1', label: 'Cor: Preto' },
  { key: 'Ctrl+2', label: 'Cor: Roxo' },
  { key: 'Ctrl+3', label: 'Cor: Vermelho' },
  { key: 'Ctrl+4', label: 'Cor: Azul' },
  { key: 'Ctrl+Shift+8', label: 'Lista com marcadores' },
  { key: 'Ctrl+Shift+7', label: 'Lista numerada' },
  { key: 'Ctrl+Alt+1', label: 'Título 1 (centralizado)' },
  { key: 'Ctrl+Alt+2', label: 'Título 2' },
] as const

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  isEditing: boolean
  placeholder?: string
}

const TOOLBAR_BUTTON_BASE =
  'px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors'
const TOOLBAR_BUTTON_ACTIVE = 'bg-violet-100 border-violet-400 text-violet-700'
const TOOLBAR_BUTTON_INACTIVE = 'bg-white text-gray-700'

const COLOR_OPTIONS = [
  { color: '#1a1a1a', label: 'Preto', shortcut: 'Ctrl+1' },
  { color: '#7C3AED', label: 'Roxo', shortcut: 'Ctrl+2' },
  { color: '#DC2626', label: 'Vermelho', shortcut: 'Ctrl+3' },
  { color: '#2563EB', label: 'Azul', shortcut: 'Ctrl+4' },
] as const

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={event => {
        event.preventDefault()
        onClick()
      }}
      className={`${TOOLBAR_BUTTON_BASE} ${
        isActive ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON_INACTIVE
      }`}
    >
      {children}
    </button>
  )
}

function AlignLeftIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <line
        x1="1"
        y1="1.5"
        x2="13"
        y2="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="4.5"
        x2="9"
        y2="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="7.5"
        x2="11"
        y2="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="10.5"
        x2="7"
        y2="10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AlignCenterIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <line
        x1="1"
        y1="1.5"
        x2="13"
        y2="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="4.5"
        x2="11"
        y2="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="2"
        y1="7.5"
        x2="12"
        y2="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="10.5"
        x2="10"
        y2="10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AlignRightIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <line
        x1="1"
        y1="1.5"
        x2="13"
        y2="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="5"
        y1="4.5"
        x2="13"
        y2="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="7.5"
        x2="13"
        y2="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="7"
        y1="10.5"
        x2="13"
        y2="10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AlignJustifyIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
      <line
        x1="1"
        y1="1.5"
        x2="13"
        y2="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="4.5"
        x2="13"
        y2="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="7.5"
        x2="13"
        y2="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="10.5"
        x2="9"
        y2="10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function RichTextEditor({
  value,
  onChange,
  isEditing,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Underline,
        TextStyle,
        Color,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
          defaultAlignment: 'justify',
        }),
        AlignmentShortcutsExtension,
        ColorShortcutsExtension,
      ],
      content: value,
      editable: isEditing,
      onUpdate: ({ editor: updatedEditor }) => {
        onChange(updatedEditor.getHTML())
      },
    },
    [],
  )

  // Sync external value changes (e.g. initial load after async fetch)
  const previousValue = React.useRef(value)
  React.useEffect(() => {
    if (!editor || value === previousValue.current) return
    previousValue.current = value
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, false)
    }
  }, [editor, value])

  // Sync editable state
  React.useEffect(() => {
    if (!editor) return
    editor.setEditable(isEditing)
  }, [editor, isEditing])

  const [showShortcuts, setShowShortcuts] = React.useState(false)

  if (!isEditing) {
    return (
      <div
        className="document-rich-content border border-gray-200 rounded p-2 min-h-[40px]"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    )
  }

  const currentColor = editor?.getAttributes('textStyle').color ?? '#1a1a1a'

  return (
    <div
      className="flex flex-col border border-gray-300 rounded bg-white"
      onClick={() => editor?.commands.focus()}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-1 border-b border-gray-200 bg-gray-50">
        {/* Formatação de texto */}
        <ToolbarButton
          title="Negrito (Ctrl+B)"
          isActive={editor?.isActive('bold')}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          title="Itálico (Ctrl+I)"
          isActive={editor?.isActive('italic')}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          title="Sublinhado (Ctrl+U)"
          isActive={editor?.isActive('underline')}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </ToolbarButton>

        <span className="w-px bg-gray-300 mx-1" />

        {/* Cores */}
        {COLOR_OPTIONS.map(({ color, label, shortcut }) => (
          <button
            key={color}
            type="button"
            title={`${label} (${shortcut})`}
            onMouseDown={event => {
              event.preventDefault()
              editor?.chain().focus().setColor(color).run()
            }}
            style={{ backgroundColor: color }}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              currentColor === color
                ? 'border-gray-800 scale-110'
                : 'border-gray-300 hover:border-gray-500'
            }`}
          />
        ))}

        <span className="w-px bg-gray-300 mx-1" />

        {/* Alinhamento */}
        <ToolbarButton
          title="Alinhar à esquerda (Ctrl+L)"
          isActive={editor?.isActive({ textAlign: 'left' })}
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeftIcon />
        </ToolbarButton>
        <ToolbarButton
          title="Centralizar (Ctrl+E)"
          isActive={editor?.isActive({ textAlign: 'center' })}
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenterIcon />
        </ToolbarButton>
        <ToolbarButton
          title="Alinhar à direita (Ctrl+R)"
          isActive={editor?.isActive({ textAlign: 'right' })}
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
        >
          <AlignRightIcon />
        </ToolbarButton>
        <ToolbarButton
          title="Justificar (Ctrl+J)"
          isActive={editor?.isActive({ textAlign: 'justify' })}
          onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustifyIcon />
        </ToolbarButton>

        <span className="w-px bg-gray-300 mx-1" />

        {/* Listas */}
        <ToolbarButton
          title="Lista com marcadores (Ctrl+Shift+8)"
          isActive={editor?.isActive('bulletList')}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          •–
        </ToolbarButton>
        <ToolbarButton
          title="Lista numerada (Ctrl+Shift+7)"
          isActive={editor?.isActive('orderedList')}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarButton>

        <span className="w-px bg-gray-300 mx-1" />

        {/* Estilos de parágrafo */}
        <ToolbarButton
          title="Parágrafo normal"
          isActive={editor?.isActive('paragraph')}
          onClick={() => editor?.chain().focus().setParagraph().run()}
        >
          ¶
        </ToolbarButton>
        <ToolbarButton
          title="Título 1 — centralizado (Ctrl+Alt+1)"
          isActive={editor?.isActive('heading', { level: 1 })}
          onClick={() => {
            if (editor?.isActive('heading', { level: 1 })) {
              editor.chain().focus().setParagraph().run()
            } else {
              editor
                ?.chain()
                .focus()
                .setHeading({ level: 1 })
                .setTextAlign('center')
                .run()
            }
          }}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          title="Título 2 (Ctrl+Alt+2)"
          isActive={editor?.isActive('heading', { level: 2 })}
          onClick={() => {
            if (editor?.isActive('heading', { level: 2 })) {
              editor.chain().focus().setParagraph().run()
            } else {
              editor?.chain().focus().setHeading({ level: 2 }).run()
            }
          }}
        >
          H2
        </ToolbarButton>

        <span className="w-px bg-gray-300 mx-1" />

        {/* Atalhos */}
        <button
          type="button"
          title="Atalhos de teclado"
          onMouseDown={event => {
            event.preventDefault()
            setShowShortcuts(previous => !previous)
          }}
          className={`${TOOLBAR_BUTTON_BASE} ${
            showShortcuts ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON_INACTIVE
          }`}
        >
          ?
        </button>
      </div>

      {/* Painel de atalhos */}
      {showShortcuts && (
        <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            {KEYBOARD_SHORTCUTS.map(({ key, label }) => (
              <div key={key} className="flex items-start gap-2">
                <kbd className="font-mono bg-white border border-gray-300 rounded px-1 whitespace-nowrap shrink-0 leading-4 mt-px">
                  {key}
                </kbd>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Área de edição */}
      <EditorContent
        editor={editor}
        className="prose-editor flex-1 cursor-text p-2 min-h-[120px] text-sm"
        placeholder={placeholder}
      />
    </div>
  )
}
