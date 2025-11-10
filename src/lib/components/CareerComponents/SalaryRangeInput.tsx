"use client";

import React from 'react';

interface SalaryRangeInputProps {
    minimumSalary: string;
    maximumSalary: string;
    setMinimumSalary: (value: string) => void;
    setMaximumSalary: (value: string) => void;
}

export default function SalaryRangeInput({
    minimumSalary,
    maximumSalary,
    setMinimumSalary,
    setMaximumSalary
}: SalaryRangeInputProps) {
    return (
        <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span>Minimum Salary</span>
                <div style={{ position: "relative" }}>
                    <span
                        style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#6c757d",
                            fontSize: "16px",
                            pointerEvents: "none",
                        }}
                    >
                        P
                    </span>
                    <input
                        type="number"
                        className="form-control"
                        style={{ paddingLeft: "28px" }}
                        placeholder="0"
                        min={0}
                        value={minimumSalary}
                        onChange={(e) => {
                            setMinimumSalary(e.target.value || "");
                        }}
                    />
                    <span style={{
                        position: "absolute",
                        right: "30px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6c757d",
                        fontSize: "16px",
                        pointerEvents: "none",
                    }}>
                        PHP
                    </span>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span>Maximum Salary</span>
                <div style={{ position: "relative" }}>
                    <span
                        style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#6c757d",
                            fontSize: "16px",
                            pointerEvents: "none",
                        }}
                    >
                        P
                    </span>
                    <input
                        type="number"
                        className="form-control"
                        style={{ paddingLeft: "28px" }}
                        placeholder="0"
                        min={0}
                        value={maximumSalary}
                        onChange={(e) => {
                            setMaximumSalary(e.target.value || "");
                        }}
                    />
                    <span style={{
                        position: "absolute",
                        right: "30px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6c757d",
                        fontSize: "16px",
                        pointerEvents: "none",
                    }}>
                        PHP
                    </span>
                </div>
            </div>
        </div>
    );
}
