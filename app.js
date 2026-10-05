// --- Firebase Modular SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBbqRltAI3imLhcqVL7TN5RAOqvcwl5_j4",
  authDomain: "taskflow-7c665.firebaseapp.com",
  projectId: "taskflow-7c665",
  storageBucket: "taskflow-7c665.firebasestorage.app",
  messagingSenderId: "349815561834",
  appId: "1:349815561834:web:7d51706f71da4c9064f413"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const tasksColRef = collection(db, "tasks");

// --- DOM Selectors ---
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCounter = document.getElementById("taskCounter");
const emptyState = document.getElementById("emptyState");
const filterButtons = document.querySelectorAll(".filter-btn");
const statusMessage = document.getElementById("statusMessage");

let tasks = [];
let currentFilter = "all";

// --- Status Banner Helper ---
function showStatus(message, type = "info", duration = 3500) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove("hidden");

  if (duration) {
    setTimeout(() => {
      statusMessage.classList.add("hidden");
    }, duration);
  }
}

// --- Prevent XSS in titles ---
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Render Logic ---
function renderTasks() {
  taskList.innerHTML = "";

  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.isCompleted;
    if (currentFilter === "completed") return task.isCompleted;
    return true;
  });

  if (filteredTasks.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  filteredTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.isCompleted ? "completed" : ""}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <div class="task-content">
        <input 
          type="checkbox" 
          id="check-${task.id}" 
          ${task.isCompleted ? "checked" : ""} 
          aria-label="Mark task as completed"
        />
        <span class="task-title">${escapeHTML(task.title)}</span>
      </div>
      <div class="task-actions">
        <button type="button" class="action-btn edit-btn" aria-label="Edit task">Edit</button>
        <button type="button" class="action-btn delete-btn" aria-label="Delete task">Delete</button>
      </div>
    `;

    // Toggle complete
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener("change", () => toggleTask(task.id, !task.isCompleted));

    // Edit button
    const editBtn = li.querySelector(".edit-btn");
    editBtn.addEventListener("click", () => startEditing(li, task));

    // Delete button
    const deleteBtn = li.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(li);
  });

  updateCounter();
}

function updateCounter() {
  const activeCount = tasks.filter((t) => !t.isCompleted).length;
  taskCounter.textContent = `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left`;
}

// --- Firestore Realtime Listener ---
function listenToTasks() {
  showStatus("Loading tasks from Cloud Firestore...", "info", 0);

  const q = query(tasksColRef, orderBy("createdAt", "desc"));

  onSnapshot(
    q,
    (snapshot) => {
      statusMessage.classList.add("hidden");
      tasks = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      renderTasks();
    },
    (error) => {
      console.error("Firestore snapshot error:", error);
      showStatus("Error syncing with database. Check your connection or Firestore rules.", "error", 0);
    }
  );
}

// --- CRUD Operations ---
async function addTask(title) {
  const trimmed = title.trim();
  if (!trimmed) return;

  try {
    taskInput.disabled = true;
    await addDoc(tasksColRef, {
      title: trimmed,
      isCompleted: false,
      createdAt: serverTimestamp()
    });
    taskInput.value = "";
  } catch (error) {
    console.error("Error adding task:", error);
    showStatus("Failed to add task. Please try again.", "error");
  } finally {
    taskInput.disabled = false;
    taskInput.focus();
  }
}

async function toggleTask(id, isCompleted) {
  try {
    const taskDocRef = doc(db, "tasks", id);
    await updateDoc(taskDocRef, { isCompleted });
  } catch (error) {
    console.error("Error updating status:", error);
    showStatus("Failed to update task status.", "error");
  }
}

async function deleteTask(id) {
  try {
    const taskDocRef = doc(db, "tasks", id);
    await deleteDoc(taskDocRef);
  } catch (error) {
    console.error("Error deleting task:", error);
    showStatus("Failed to delete task.", "error");
  }
}

function startEditing(liElement, task) {
  const contentDiv = liElement.querySelector(".task-content");
  const titleSpan = liElement.querySelector(".task-title");
  const editBtn = liElement.querySelector(".edit-btn");

  const input = document.createElement("input");
  input.type = "text";
  input.className = "edit-input";
  input.value = task.title;

  contentDiv.replaceChild(input, titleSpan);
  input.focus();
  editBtn.textContent = "Save";

  const saveEdit = async () => {
    const updatedTitle = input.value.trim();
    if (updatedTitle && updatedTitle !== task.title) {
      try {
        const taskDocRef = doc(db, "tasks", task.id);
        await updateDoc(taskDocRef, { title: updatedTitle });
      } catch (error) {
        console.error("Error saving title:", error);
        showStatus("Failed to update task title.", "error");
        renderTasks();
      }
    } else {
      renderTasks();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") renderTasks();
  });

  editBtn.onclick = saveEdit;
}

// --- Event Listeners ---
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask(taskInput.value);
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// Start listening for real-time Firestore updates
listenToTasks();