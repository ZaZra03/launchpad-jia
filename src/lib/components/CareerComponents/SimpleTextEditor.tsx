"use client";

import React, { useRef, useEffect } from "react";

interface SimpleTextEditorProps {
    setText: (text: string) => void;
    text: string;
    placeholder?: string;
}

export default function SimpleTextEditor({ setText, text, placeholder = "Enter text" }: SimpleTextEditorProps) {
    const editorRef = useRef(null);

    const handleChange = () => {
        if (editorRef.current && setText) {
            setText(editorRef.current.innerHTML);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();

        // Get plain text from clipboard
        const text = e.clipboardData.getData('text/plain');

        // Insert the plain text at cursor position
        document.execCommand('insertText', false, text);

        // Update the state
        handleChange();
    };

    // Handle placeholder for contenteditable div
    useEffect(() => {
        const editor = editorRef.current;
        if (editor) {
            const handleFocus = () => {
                if (editor.innerHTML === '' || editor.innerHTML === '<br>') {
                    editor.innerHTML = '';
                }
            };

            const handleBlur = () => {
                if (editor.innerHTML === '' || editor.innerHTML === '<br>') {
                    editor.innerHTML = '';
                }
            };

            editor.addEventListener('focus', handleFocus);
            editor.addEventListener('blur', handleBlur);

            return () => {
                editor.removeEventListener('focus', handleFocus);
                editor.removeEventListener('blur', handleBlur);
            };
        }
    }, []);

    useEffect(() => {
        if (editorRef.current && !editorRef.current.innerHTML && text) {
            editorRef.current.innerHTML = text;
        }
    }, [text]);

    return (
        <>
            <div
                ref={editorRef}
                contentEditable={true}
                className="form-control"
                style={{
                    height: "300px",
                    overflowY: "auto",
                    padding: "12px",
                    lineHeight: "1.5",
                    position: "relative",
                    borderRadius: "4px"
                }}
                onInput={handleChange}
                onBlur={handleChange}
                onPaste={handlePaste}
                data-placeholder={placeholder}
            ></div>
            <style jsx>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #6c757d;
          pointer-events: none;
          position: absolute;
          top: 12px;
          left: 12px;
        }
      `}</style>
        </>
    );
}