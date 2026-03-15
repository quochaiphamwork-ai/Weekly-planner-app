import { useEffect, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"

function formatDateTimeLocal(dateValue) {
  if (!dateValue) return ""

  const date = new Date(dateValue)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatReadableDate(dateValue) {
  if (!dateValue) return "Not set"

  return new Date(dateValue).toLocaleString()
}

function getCurrentScrollTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")

  return `${hours}:${minutes}:00`
}

const taskColors = [
  "#3788d8",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
]

const defaultCategories = [
  { id: "general", name: "General", color: "#3788d8" },
  { id: "work", name: "Work", color: "#10b981" },
  { id: "personal", name: "Personal", color: "#ec4899" },
]

function Calendar({
  tasks,
  onAddTask,
  onDeleteTask,
  onUpdateTaskTime,
  onUpdateTaskDetails,
}) {
  const [scrollTime] = useState(() => getCurrentScrollTime())
  const [categories, setCategories] = useState(() => {
    const savedCategories = localStorage.getItem("taskCategories")

    if (!savedCategories) return defaultCategories

    try {
      const parsedCategories = JSON.parse(savedCategories)
      return parsedCategories.length > 0 ? parsedCategories : defaultCategories
    } catch {
      return defaultCategories
    }
  })
  const [addTaskModal, setAddTaskModal] = useState({
    visible: false,
    title: "",
    start: "",
    end: "",
    allDay: false,
    color: "#3788d8",
    categoryId: "general",
  })
  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#3788d8",
  })
  const [detailsModal, setDetailsModal] = useState({
    visible: false,
    title: "",
    start: "",
    end: "",
    color: "#3788d8",
    categoryName: "General",
  })
  const [editMenu, setEditMenu] = useState({
    visible: false,
    taskId: "",
    title: "",
    start: "",
    end: "",
    color: "#3788d8",
  })

  const handleDateSelect = (selectInfo) => {
    const defaultCategory = categories[0] || defaultCategories[0]

    setAddTaskModal({
      visible: true,
      title: "",
      start: formatDateTimeLocal(selectInfo.start),
      end: formatDateTimeLocal(selectInfo.end),
      allDay: selectInfo.allDay,
      color: defaultCategory.color,
      categoryId: defaultCategory.id,
    })

    selectInfo.view.calendar.unselect()
  }

  const handleEventClick = (clickInfo) => {
    setDetailsModal({
      visible: true,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      color:
        clickInfo.event.backgroundColor ||
        clickInfo.event.extendedProps.backgroundColor ||
        "#3788d8",
      categoryName: clickInfo.event.extendedProps.categoryName || "General",
    })
  }

  const handleEventChange = (changeInfo) => {
    onUpdateTaskTime({
      id: changeInfo.event.id,
      start: changeInfo.event.start,
      end: changeInfo.event.end,
      allDay: changeInfo.event.allDay,
    })
  }

  const handleEventDidMount = (info) => {
    info.el.addEventListener("contextmenu", (event) => {
      event.preventDefault()

      setEditMenu({
        visible: true,
        taskId: info.event.id,
        title: info.event.title,
        start: formatDateTimeLocal(info.event.start),
        end: formatDateTimeLocal(info.event.end),
        color:
          info.event.backgroundColor ||
          info.event.extendedProps.backgroundColor ||
          "#3788d8",
      })
    })
  }

  const closeAddTaskModal = () => {
    setAddTaskModal((prev) => ({ ...prev, visible: false }))
    setNewCategory({
      name: "",
      color: "#3788d8",
    })
  }

  const closeDetailsModal = () => {
    setDetailsModal((prev) => ({ ...prev, visible: false }))
  }

  const closeEditMenu = () => {
    setEditMenu((prev) => ({ ...prev, visible: false }))
  }

  const saveNewTask = () => {
    const trimmedTitle = addTaskModal.title.trim()
    const selectedCategory = categories.find(
      (category) => category.id === addTaskModal.categoryId
    )
    const taskColor = selectedCategory?.color || addTaskModal.color || "#3788d8"

    if (!trimmedTitle || !addTaskModal.start || !addTaskModal.end) return

    onAddTask({
      id: crypto.randomUUID(),
      title: trimmedTitle,
      start: new Date(addTaskModal.start),
      end: new Date(addTaskModal.end),
      allDay: addTaskModal.allDay,
      backgroundColor: taskColor,
      borderColor: taskColor,
      categoryId: selectedCategory?.id || "",
      categoryName: selectedCategory?.name || "",
    })

    closeAddTaskModal()
  }

  const handleCategoryChange = (categoryId) => {
    const selectedCategory = categories.find((category) => category.id === categoryId)

    if (!selectedCategory) return

    setAddTaskModal((prev) => ({
      ...prev,
      categoryId: selectedCategory.id,
      color: selectedCategory.color,
    }))
  }

  const addCategory = () => {
    const trimmedName = newCategory.name.trim()

    if (!trimmedName) return

    const createdCategory = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: newCategory.color,
    }

    setCategories((prev) => [...prev, createdCategory])
    setAddTaskModal((prev) => ({
      ...prev,
      categoryId: createdCategory.id,
      color: createdCategory.color,
    }))
    setNewCategory({
      name: "",
      color: createdCategory.color,
    })
  }

  const saveEditMenuChanges = () => {
    if (!editMenu.taskId || !editMenu.start || !editMenu.end) return

    onUpdateTaskDetails({
      id: editMenu.taskId,
      start: new Date(editMenu.start),
      end: new Date(editMenu.end),
      backgroundColor: editMenu.color,
    })

    closeEditMenu()
  }

  const handleDeleteFromMenu = () => {
    if (!editMenu.taskId) return

    onDeleteTask(editMenu.taskId)
    closeEditMenu()
  }

  useEffect(() => {
    const handleWindowClick = () => {
      if (editMenu.visible) {
        closeEditMenu()
      }
    }

    window.addEventListener("click", handleWindowClick)

    return () => {
      window.removeEventListener("click", handleWindowClick)
    }
  }, [editMenu.visible])

  useEffect(() => {
    localStorage.setItem("taskCategories", JSON.stringify(categories))
  }, [categories])

  return (
    <div
      style={{
        padding: "8px 8px 12px",
        position: "relative",
        backgroundColor: "transparent",
        height: "calc(100svh - 170px)",
        minHeight: "280px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>
        {`
          .calendar-modal-input {
            color: #111827;
            caret-color: #111827;
          }

          .calendar-modal-input::placeholder {
            color: #9ca3af;
          }

          .calendar-shell {
            background: rgba(255, 255, 255, 0.94);
            border: 1px solid rgba(17,17,17,0.16);
            border-radius: 36px;
            padding: 18px 18px 16px;
            overflow: hidden;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.65), 0 16px 30px rgba(0,0,0,0.06);
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .calendar-shell .fc {
            background: transparent;
            color: #111111;
            font-family: Arial, sans-serif;
          }

          .calendar-shell .fc-scrollgrid {
            border: 1px solid rgba(17,17,17,0.18);
            border-radius: 24px;
            overflow: hidden;
          }

          .calendar-shell .fc-col-header-cell {
            background-color: #f5f5dc !important;
            border: 1px solid rgba(17,17,17,0.12);
            height: 44px;
            vertical-align: middle;
          }

          .calendar-shell .fc-col-header-cell-cushion {
            color: #111111;
            font-weight: 700;
            font-size: 15px;
            text-decoration: none;
            padding: 10px 0;
            display: inline-block;
          }

          .calendar-shell .fc-timegrid-slot-label-cushion {
            color: #1a1a1a;
            font-size: 16px;
            font-weight: 700;
            padding: 8px 0;
            letter-spacing: 0.2px;
            text-align: center;
            background: rgba(247,247,247,0.85);
            border-top-left-radius: 14px;
            border-bottom-left-radius: 14px;
            margin: 2px 0;
            line-height: 1.2;
            box-shadow: 1px 0 0 #e0e0e0;
          }

          .calendar-shell .fc-timegrid-slot,
          .calendar-shell .fc-timegrid-col,
          .calendar-shell .fc-timegrid-axis {
            background: #ffffff;
          }

          .calendar-shell .fc-timegrid-slot {
            border-bottom: 1px solid rgba(17,17,17,0.18);
            height: 54px;
            border-radius: 12px;
            overflow: hidden;
          }

          .calendar-shell .fc-timegrid-col {
            border-right: 1px solid rgba(17,17,17,0.14);
            border-radius: 12px;
            overflow: hidden;
          }

          .calendar-shell .fc-timegrid-axis {
            border-right: 1px solid rgba(17,17,17,0.14);
            width: 58px;
          }

          .calendar-shell .fc-timegrid-slot-lane:hover {
            background: #fafaf2;
          }

          .calendar-shell .fc-timegrid-now-indicator-line {
            border-color: #ff3b30;
            border-width: 2px;
          }

          .calendar-shell .fc-timegrid-now-indicator-arrow {
            border-left-color: #ff3b30;
          }

          .calendar-shell .fc-event {
            border-radius: 10px;
            border-width: 1px;
            font-weight: 600;
            padding: 2px 4px;
          }

          .calendar-shell .fc-toolbar-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #111111;
          }

          .calendar-shell .fc-button {
            border-radius: 10px;
            font-weight: 600;
          }
        `}
      </style>

      <div className="calendar-shell">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          scrollTime={scrollTime}
          scrollTimeReset={false}
          selectable={true}
          editable={true}
          events={tasks}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventChange}
          eventResize={handleEventChange}
          eventDidMount={handleEventDidMount}
          height="100%"
          allDaySlot={false}
          nowIndicator={true}
        />
      </div>

      {addTaskModal.visible && (
        <div
          onClick={closeAddTaskModal}
          style={{
            position: "fixed",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(17, 24, 39, 0.45), rgba(17, 24, 39, 0.28))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "430px",
              background: "linear-gradient(180deg, #fffdf7 0%, #ffffff 100%)",
              color: "#111827",
              borderRadius: "24px",
              padding: "24px",
              border: "1px solid #e7dcc2",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.18)",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#9a7b2f",
              }}
            >
              Add Task
            </p>
            <h2 style={{ margin: "0 0 8px", fontSize: "28px", color: "#1f2937" }}>
              Create a new plan
            </h2>
            <p style={{ margin: "0 0 18px", color: "#6b7280", fontSize: "14px" }}>
              Add a title, time range, and choose a category color.
            </p>

            <label style={{ display: "block", marginBottom: "14px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151" }}>
                Task title
              </span>
              <input
                className="calendar-modal-input"
                type="text"
                value={addTaskModal.title}
                onChange={(e) =>
                  setAddTaskModal((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Workout, meeting, study block..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #d6d3d1",
                  background: "#ffffff",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "14px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151" }}>
                Start
              </span>
              <input
                className="calendar-modal-input"
                type="datetime-local"
                value={addTaskModal.start}
                onChange={(e) =>
                  setAddTaskModal((prev) => ({ ...prev, start: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #d6d3d1",
                  background: "#ffffff",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "14px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151" }}>
                End
              </span>
              <input
                className="calendar-modal-input"
                type="datetime-local"
                value={addTaskModal.end}
                onChange={(e) =>
                  setAddTaskModal((prev) => ({ ...prev, end: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #d6d3d1",
                  background: "#ffffff",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "14px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151" }}>
                Category
              </span>
              <select
                value={addTaskModal.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #d6d3d1",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div
              style={{
                marginBottom: "16px",
                padding: "14px 16px",
                borderRadius: "16px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              <span style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                Selected category color
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "999px",
                    background: addTaskModal.color,
                    boxShadow: "0 0 0 3px #ffffff, 0 0 0 4px #d1d5db",
                  }}
                />
                <span style={{ color: "#111827", fontWeight: 600 }}>
                  {
                    categories.find((category) => category.id === addTaskModal.categoryId)
                      ?.name
                  }
                </span>
              </div>
            </div>

            <div
              style={{
                marginBottom: "20px",
                padding: "16px",
                borderRadius: "16px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#1f2937" }}>
                Create category
              </p>

              <div style={{ marginBottom: "14px" }}>
                <span style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#374151" }}>
                  Category color
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  {taskColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategory((prev) => ({ ...prev, color }))}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "999px",
                        border:
                          newCategory.color === color
                            ? "3px solid #111827"
                            : "2px solid #ffffff",
                        background: color,
                        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.14)",
                        cursor: "pointer",
                      }}
                    />
                  ))}

                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) =>
                      setNewCategory((prev) => ({ ...prev, color: e.target.value }))
                    }
                    style={{
                      width: "42px",
                      height: "32px",
                      border: "1px solid #d1d5db",
                      borderRadius: "10px",
                      background: "#ffffff",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "10px",
                  alignItems: "end",
                }}
              >
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151" }}>
                    Category name
                  </span>
                  <input
                    className="calendar-modal-input"
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Study, Health, Meetings..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid #d6d3d1",
                      background: "#ffffff",
                      fontSize: "15px",
                      boxSizing: "border-box",
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={addCategory}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "none",
                    background: "#111827",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            <label style={{ display: "block", marginBottom: "20px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151" }}>
                Override color
              </span>
              <input
                type="color"
                value={addTaskModal.color}
                onChange={(e) =>
                  setAddTaskModal((prev) => ({ ...prev, color: e.target.value }))
                }
                style={{
                  width: "56px",
                  height: "38px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  background: "#ffffff",
                  cursor: "pointer",
                  padding: "2px",
                }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={closeAddTaskModal}
                style={{
                  padding: "10px 16px",
                  borderRadius: "999px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#374151",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveNewTask}
                style={{
                  padding: "10px 18px",
                  borderRadius: "999px",
                  border: "none",
                  background: "linear-gradient(135deg, #111827, #374151)",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save task
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsModal.visible && (
        <div
          onClick={closeDetailsModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "320px",
              background: "white",
              borderRadius: "18px",
              padding: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>{detailsModal.title}</h2>
            <p>
              <strong>Start:</strong> {formatReadableDate(detailsModal.start)}
            </p>
            <p>
              <strong>End:</strong> {formatReadableDate(detailsModal.end)}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong>Category:</strong>
              <span>{detailsModal.categoryName}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
              <strong>Color:</strong>
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  background: detailsModal.color,
                  borderRadius: "4px",
                  display: "inline-block",
                }}
              />
            </div>
            <div style={{ marginTop: "20px" }}>
              <button onClick={closeDetailsModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {editMenu.visible && (
        <div
          onClick={closeEditMenu}
          style={{
            position: "fixed",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(17, 24, 39, 0.45), rgba(17, 24, 39, 0.28))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "430px",
              background: "linear-gradient(180deg, #fffdf7 0%, #ffffff 100%)",
              color: "#111827",
              borderRadius: "24px",
              padding: "24px",
              border: "1px solid #e7dcc2",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.18)",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#9a7b2f",
              }}
            >
              Edit Task
            </p>
            <h3 style={{ margin: "0 0 18px", fontSize: "28px", color: "#1f2937" }}>
              {editMenu.title}
            </h3>

            <label style={{ display: "block", marginBottom: "14px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151" }}>
                Color
              </span>
              <input
                type="color"
                value={editMenu.color}
                onChange={(e) =>
                  setEditMenu((prev) => ({ ...prev, color: e.target.value }))
                }
                style={{
                  width: "56px",
                  height: "38px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  background: "#ffffff",
                  cursor: "pointer",
                  padding: "2px",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "14px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151" }}>
                Start
              </span>
              <input
                className="calendar-modal-input"
                type="datetime-local"
                value={editMenu.start}
                onChange={(e) =>
                  setEditMenu((prev) => ({ ...prev, start: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #d6d3d1",
                  background: "#ffffff",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "20px" }}>
              <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#374151" }}>
                End
              </span>
              <input
                className="calendar-modal-input"
                type="datetime-local"
                value={editMenu.end}
                onChange={(e) =>
                  setEditMenu((prev) => ({ ...prev, end: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #d6d3d1",
                  background: "#ffffff",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={closeEditMenu}
                style={{
                  padding: "10px 16px",
                  borderRadius: "999px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#374151",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFromMenu}
                style={{
                  padding: "10px 16px",
                  borderRadius: "999px",
                  border: "1px solid #fecaca",
                  background: "#fff1f2",
                  color: "#b91c1c",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
              <button
                onClick={saveEditMenuChanges}
                style={{
                  padding: "10px 18px",
                  borderRadius: "999px",
                  border: "none",
                  background: "linear-gradient(135deg, #111827, #374151)",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
