import { useEffect, useState } from "react"
import Calendar from "./components/Calendar"

const resizeDirections = [
  { key: "top", cursor: "ns-resize" },
  { key: "right", cursor: "ew-resize" },
  { key: "bottom", cursor: "ns-resize" },
  { key: "left", cursor: "ew-resize" },
  { key: "top-left", cursor: "nwse-resize" },
  { key: "top-right", cursor: "nesw-resize" },
  { key: "bottom-left", cursor: "nesw-resize" },
  { key: "bottom-right", cursor: "nwse-resize" },
]

function resizeBounds(direction, startBounds, deltaX, deltaY) {
  let { x, y, width, height } = startBounds

  if (direction.includes("right")) {
    width += deltaX
  }

  if (direction.includes("left")) {
    width -= deltaX
    x += deltaX
  }

  if (direction.includes("bottom")) {
    height += deltaY
  }

  if (direction.includes("top")) {
    height -= deltaY
    y += deltaY
  }

  return { x, y, width, height }
}

function App() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tasks")
    return savedTasks ? JSON.parse(savedTasks) : []
  })

  const addTask = (newTask) => {
    setTasks((prevTasks) => [
      ...prevTasks,
      {
        ...newTask,
        backgroundColor: newTask.backgroundColor || "#3788d8",
        borderColor: newTask.borderColor || newTask.backgroundColor || "#3788d8",
      },
    ])
  }

  const deleteTask = (taskId) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
  }

  const updateTaskTime = ({ id, start, end, allDay }) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              start,
              end,
              allDay,
            }
          : task
      )
    )
  }

  const updateTaskDetails = ({ id, start, end, backgroundColor }) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              start,
              end,
              backgroundColor,
              borderColor: backgroundColor,
            }
          : task
      )
    )
  }

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  const startResize = async (direction, event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!window.desktopPlanner?.getWidgetBounds || !window.desktopPlanner?.setWidgetBounds) {
      return
    }

    const startBounds = await window.desktopPlanner.getWidgetBounds()
    if (!startBounds) return

    const startMouseX = event.screenX
    const startMouseY = event.screenY
    let rafId = null
    let pendingBounds = null

    const flushBounds = () => {
      rafId = null

      if (!pendingBounds) return

      window.desktopPlanner.setWidgetBounds(pendingBounds)
      pendingBounds = null
    }

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.screenX - startMouseX
      const deltaY = moveEvent.screenY - startMouseY
      const nextBounds = resizeBounds(direction, startBounds, deltaX, deltaY)

      if (direction.includes("left") && nextBounds.width < startBounds.minWidth) {
        nextBounds.x = startBounds.x + (startBounds.width - startBounds.minWidth)
      }

      if (direction.includes("top") && nextBounds.height < startBounds.minHeight) {
        nextBounds.y = startBounds.y + (startBounds.height - startBounds.minHeight)
      }

      nextBounds.width = Math.max(startBounds.minWidth, nextBounds.width)
      nextBounds.height = Math.max(startBounds.minHeight, nextBounds.height)

      pendingBounds = nextBounds

      if (rafId === null) {
        rafId = window.requestAnimationFrame(flushBounds)
      }
    }

    const handleMouseUp = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }

      if (pendingBounds) {
        window.desktopPlanner.setWidgetBounds(pendingBounds)
        pendingBounds = null
      }

      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      style={{
        minHeight: "100svh",
        padding: "12px",
        boxSizing: "border-box",
        background: "transparent",
        position: "relative",
      }}
    >
      <div
        style={{
          minHeight: "calc(100svh - 24px)",
          borderRadius: "140px",
          background: "linear-gradient(180deg, rgba(255, 253, 247, 0.97), rgba(255, 250, 240, 0.93))",
          boxShadow: "0 28px 70px rgba(15, 23, 42, 0.16)",
          border: "2px solid rgba(17, 17, 17, 0.9)",
          backdropFilter: "blur(16px)",
          overflow: "hidden",
          padding: "0 42px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "18px 20px 2px",
            WebkitAppRegion: "drag",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#9a7b2f",
                marginBottom: "6px",
              }}
            >
              Desktop Widget
            </div>
            <h1
              style={{
                textAlign: "left",
                margin: 0,
                fontSize: "32px",
                lineHeight: 1.05,
              }}
            >
              Weekly Planner
            </h1>
            <p style={{ marginTop: "6px", color: "#6b7280", fontSize: "13px" }}>
              Drag this top bar to move. Resize from any edge or corner.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              WebkitAppRegion: "no-drag",
            }}
          >
            <button
              onClick={() => window.desktopPlanner?.resetWidgetPosition?.()}
              style={{
                borderRadius: "999px",
                border: "1px solid #d6d3d1",
                background: "#ffffff",
                color: "#374151",
                minWidth: "88px",
                height: "40px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                padding: "0 16px",
              }}
              title="Reset widget position"
            >
              Reset
            </button>
            <button
              onClick={() => window.desktopPlanner?.closeWidget?.()}
              style={{
                borderRadius: "999px",
                border: "1px solid #fecaca",
                background: "#fff1f2",
                color: "#b91c1c",
                width: "40px",
                height: "40px",
                fontWeight: 700,
                fontSize: "20px",
                lineHeight: 1,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
              title="Close widget"
            >
              x
            </button>
          </div>
        </div>
        <Calendar
          tasks={tasks}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onUpdateTaskTime={updateTaskTime}
          onUpdateTaskDetails={updateTaskDetails}
        />
      </div>
      {resizeDirections.map(({ key, cursor }) => {
        const positionStyle =
          key === "top"
            ? { top: 2, left: 26, right: 26, height: 14 }
            : key === "bottom"
              ? { bottom: 2, left: 26, right: 26, height: 14 }
              : key === "left"
                ? { top: 28, bottom: 28, left: 2, width: 14 }
                : key === "right"
                  ? { top: 28, bottom: 28, right: 2, width: 14 }
                  : key === "top-left"
                    ? { top: 2, left: 2, width: 28, height: 28 }
                    : key === "top-right"
                      ? { top: 2, right: 2, width: 28, height: 28 }
                      : key === "bottom-left"
                        ? { bottom: 2, left: 2, width: 28, height: 28 }
                        : { bottom: 2, right: 2, width: 28, height: 28 }

        return (
          <div
            key={key}
            onMouseDown={(event) => startResize(key, event)}
            style={{
              position: "absolute",
              zIndex: 20000,
              cursor,
              background: "transparent",
              pointerEvents: "auto",
              ...positionStyle,
            }}
          />
        )
      })}
    </div>
  )
}

export default App
