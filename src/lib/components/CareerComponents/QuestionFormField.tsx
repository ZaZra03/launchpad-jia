"use client";

import React, { useState } from 'react';
import CustomDropdown from './CustomDropdown';
import SalaryRangeInput from './SalaryRangeInput';

const questionTypeOptions = [
    { name: "Short Answer" },
    { name: "Long Answer" },
    { name: "Dropdown" },
    { name: "Checkboxes" },
    { name: "Range" },
];

interface QuestionFormFieldProps {
    question: string;
    questionType: string;
    config?: any;
    onUpdate: (question: string, type: string, config?: any) => void;
    onRemove: () => void;
    dragHandleProps?: any;
}

export default function QuestionFormField({
    question: initialQuestion,
    questionType: initialQuestionType,
    config: initialConfig,
    onUpdate,
    onRemove,
    dragHandleProps
}: QuestionFormFieldProps) {
    const [question, setQuestion] = useState(initialQuestion);
    const [questionType, setQuestionType] = useState(initialQuestionType);

    // State for different input types - initialize from config
    const [dropdownOptions, setDropdownOptions] = useState<string[]>(initialConfig?.options || []);
    const [newDropdownOption, setNewDropdownOption] = useState("");
    const [checkboxOptions, setCheckboxOptions] = useState<string[]>(initialConfig?.options || []);
    const [newCheckboxOption, setNewCheckboxOption] = useState("");
    const [minRange, setMinRange] = useState(initialConfig?.min || "");
    const [maxRange, setMaxRange] = useState(initialConfig?.max || "");

    const handleUpdate = () => {
        let config: any = {};

        switch (questionType) {
            case "Dropdown":
                config = { options: dropdownOptions };
                break;
            case "Checkboxes":
                config = { options: checkboxOptions };
                break;
            case "Range":
                config = { min: minRange, max: maxRange };
                break;
        }

        onUpdate(question, questionType, config);
    };

    return (
        <>
            <div
                className="layered-card-wrapper"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                {/* Drag Handle (6 dots) */}
                <div
                    {...dragHandleProps}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "2px",
                        cursor: "grab",
                        padding: "4px",
                    }}
                >
                    {[...Array(3)].map((_, rowIndex) => (
                        <div key={rowIndex} style={{ display: "flex", gap: "2px" }}>
                            {[...Array(2)].map((_, dotIndex) => (
                                <div
                                    key={dotIndex}
                                    style={{
                                        width: "4px",
                                        height: "4px",
                                        borderRadius: "50%",
                                        backgroundColor: "#9CA3AF",
                                    }}
                                ></div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="layered-card-middle">
                    {/* Content */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", flexDirection: "row", gap: "12px", alignItems: "center" }}>
                            <div style={{ flex: 2 }}>
                                <input
                                    value={question}
                                    className="form-control"
                                    placeholder="Write your question..."
                                    onChange={(e) => {
                                        setQuestion(e.target.value);
                                    }}
                                    onBlur={handleUpdate}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <CustomDropdown
                                    onSelectSetting={(type: string) => {
                                        setQuestionType(type);
                                        handleUpdate();
                                    }}
                                    screeningSetting={questionType}
                                    settingList={questionTypeOptions}
                                    placeholder="Select Type"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="layered-card-content">
                        {/* Configuration based on type */}
                        {questionType === "Dropdown" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
                                {/* Options List */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {dropdownOptions.map((option, index) => (
                                        <div key={index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                flex: 1,
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                overflow: "hidden"
                                            }}>
                                                <span style={{
                                                    fontSize: "14px",
                                                    color: "#6b7280",
                                                    padding: "8px 16px",
                                                    borderRight: "1px solid #d1d5db",
                                                    background: "#f9fafb"
                                                }}>
                                                    {index + 1}
                                                </span>
                                                <input
                                                    className="form-control"
                                                    style={{
                                                        border: "none",
                                                        outline: "none",
                                                        boxShadow: "none",
                                                        flex: 1,
                                                        fontSize: "14px"
                                                    }}
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...dropdownOptions];
                                                        newOptions[index] = e.target.value;
                                                        setDropdownOptions(newOptions);
                                                    }}
                                                    onBlur={handleUpdate}
                                                />
                                            </div>
                                            <button
                                                style={{
                                                    padding: "6px",
                                                    background: "transparent",
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: "50%",
                                                    cursor: "pointer",
                                                    color: "#9ca3af",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: "28px",
                                                    height: "28px"
                                                }}
                                                onClick={() => {
                                                    const newOptions = dropdownOptions.filter((_, i) => i !== index);
                                                    setDropdownOptions(newOptions);
                                                    handleUpdate();
                                                }}
                                            >
                                                <i className="la la-times" style={{ fontSize: "16px" }}></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Option Button */}
                                <button
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        background: "transparent",
                                        border: "none",
                                        color: "#6b7280",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        padding: "0"
                                    }}
                                    onClick={() => {
                                        setDropdownOptions([...dropdownOptions, ""]);
                                    }}
                                >
                                    <i className="la la-plus" style={{ fontSize: "16px" }}></i>
                                    <span>Add Option</span>
                                </button>
                            </div>
                        )}

                        {questionType === "Checkboxes" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
                                {/* Options List */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {checkboxOptions.map((option, index) => (
                                        <div key={index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                flex: 1,
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                overflow: "hidden"
                                            }}>
                                                <span style={{
                                                    fontSize: "14px",
                                                    color: "#6b7280",
                                                    padding: "8px 16px",
                                                    borderRight: "1px solid #d1d5db",
                                                    background: "#f9fafb"
                                                }}>
                                                    {index + 1}
                                                </span>
                                                <input
                                                    className="form-control"
                                                    style={{
                                                        border: "none",
                                                        outline: "none",
                                                        boxShadow: "none",
                                                        flex: 1,
                                                        fontSize: "14px"
                                                    }}
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...checkboxOptions];
                                                        newOptions[index] = e.target.value;
                                                        setCheckboxOptions(newOptions);
                                                    }}
                                                    onBlur={handleUpdate}
                                                />
                                            </div>
                                            <button
                                                style={{
                                                    padding: "6px",
                                                    background: "transparent",
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: "50%",
                                                    cursor: "pointer",
                                                    color: "#9ca3af",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: "28px",
                                                    height: "28px"
                                                }}
                                                onClick={() => {
                                                    const newOptions = checkboxOptions.filter((_, i) => i !== index);
                                                    setCheckboxOptions(newOptions);
                                                    handleUpdate();
                                                }}
                                            >
                                                <i className="la la-times" style={{ fontSize: "16px" }}></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Option Button */}
                                <button
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        background: "transparent",
                                        border: "none",
                                        color: "#6b7280",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        padding: "0"
                                    }}
                                    onClick={() => {
                                        setCheckboxOptions([...checkboxOptions, ""]);
                                    }}
                                >
                                    <i className="la la-plus" style={{ fontSize: "16px" }}></i>
                                    <span>Add Option</span>
                                </button>
                            </div>
                        )}

                        {questionType === "Range" && (
                            <div style={{ marginBottom: "16px" }}>
                                <SalaryRangeInput
                                    minimumSalary={minRange}
                                    maximumSalary={maxRange}
                                    setMinimumSalary={(val) => {
                                        setMinRange(val);
                                        handleUpdate();
                                    }}
                                    setMaximumSalary={(val) => {
                                        setMaxRange(val);
                                        handleUpdate();
                                    }}
                                />
                            </div>
                        )}

                        <hr style={{ border: "none", borderTop: "1px solid #E9EAEB", margin: "16px 0" }} />

                        {/* Remove Button */}
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                style={{
                                    background: "white",
                                    color: "#DC2626",
                                    border: "1px solid #DC2626",
                                    padding: "8px 16px",
                                    borderRadius: "20px",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    width: "auto",
                                }}
                                onClick={onRemove}
                            >
                                <i className="la la-trash" style={{ marginRight: 4 }}></i>
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}