"use client"

import React from "react";

interface Step {
  number: number;
  title: string;
  description?: string;
}

interface ProgressStepBarProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
}

export default function ProgressStepBar({ steps, currentStep, onStepClick }: ProgressStepBarProps) {
  return (
    <div style={{ width: "100%", padding: "40px 0" }}>
      <div style={{ display: "flex", position: "relative", width: "100%" }}>
        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isClickable = onStepClick && step.number <= currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.number}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                {/* Step Circle - Target Style */}
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: `2px solid ${isCompleted || isCurrent ? "#181D27" : "#D1D5DB"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                    transition: "all 0.3s ease",
                    backgroundColor: isCompleted ? "#181D27" : "#FFFFFF",
                    cursor: isClickable ? "pointer" : "default",
                    flexShrink: 0,
                  }}
                  onClick={() => isClickable && onStepClick(step.number)}
                >
                  {isCompleted ? (
                    <i
                      className="la la-check"
                      style={{
                        fontSize: "12px",
                        color: "#FFFFFF",
                        fontWeight: "bold",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: isCurrent ? "#181D27" : "#D1D5DB",
                        transition: "all 0.3s ease",
                      }}
                    />
                  )}
                </div>

                {/* Step Label */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: isCurrent ? 600 : 500,
                      color: isCompleted || isCurrent ? "#181D27" : "#6B7280",
                      marginBottom: "4px",
                      maxWidth: "100px",
                      wordWrap: "break-word",
                    }}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9CA3AF",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div
                  style={{
                    flex: 1,
                    height: "4px",
                    background: step.number < currentStep
                      ? "linear-gradient(90deg, #9fcaed 0%, #ceb6da 33%, #ebacc9 66%, #fccec0 100%)"
                      : "#D1D5DB",
                    marginLeft: "1px",
                    marginRight: "1px",
                    alignSelf: "flex-start",
                    marginTop: "9px",
                    transition: "background 0.3s ease",
                    borderRadius: "3px",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}