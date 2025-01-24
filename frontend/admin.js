const API_BASE = "http://localhost:3000/api/search";

    // Allow pressing Enter to trigger search
    document.getElementById("skillInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") search();
    });


    function setVisible(id, visible) {
      document.getElementById(id).classList.toggle("hidden", !visible);
    }

    function resetUI() {
      setVisible("tableWrapper", false);
      setVisible("emptyState",   false);
      setVisible("errorState",   false);
      setVisible("statusBar",    false);
      document.getElementById("resultsBody").innerHTML = "";
    }

    function scoreColor(score) {
      if (score >= 70) return "bg-emerald-500";
      if (score >= 40) return "bg-amber-400";
      return "bg-red-500";
    }

    function renderRow(student, index) {
      const color = scoreColor(student.resume_score);
      const delay = `animation-delay: ${index * 40}ms`;
      return `
        <tr class="row-enter hover:bg-zinc-900/60 transition-colors" style="${delay}">
          <td class="px-5 py-4 font-medium text-zinc-100">${student.name}</td>
          <td class="px-5 py-4">
            <span class="bg-zinc-800 text-emerald-400 text-xs font-mono px-2 py-1 rounded">
              ${student.skills}
            </span>
          </td>
          <td class="px-5 py-4">
            <div class="flex items-center gap-3">
              <div class="w-24 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div class="score-bar h-full ${color} rounded-full" style="width: ${student.resume_score}%"></div>
              </div>
              <span class="text-zinc-300 text-xs font-mono">${student.resume_score}</span>
            </div>
          </td>
        </tr>`;
    }

    async function search() {
      const skill = document.getElementById("skillInput").value.trim();
      const btn   = document.getElementById("searchBtn");

      if (!skill) {
        document.getElementById("skillInput").focus();
        return;
      }

      resetUI();
      btn.textContent = "Searching…";
      btn.disabled = true;

      try {
        const res  = await fetch(`${API_BASE}?skill=${encodeURIComponent(skill)}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || `Server error: ${res.status}`);
        }

        const students = json.data || [];

        if (students.length === 0) {
          setVisible("emptyState", true);
        } else {
          const tbody = document.getElementById("resultsBody");
          tbody.innerHTML = students.map(renderRow).join("");
          setVisible("tableWrapper", true);

          const statusBar = document.getElementById("statusBar");
          statusBar.textContent = `${students.length} result${students.length !== 1 ? "s" : ""} for "${skill}" — sorted by score`;
          setVisible("statusBar", true);
        }

      } catch (err) {
        document.getElementById("errorMsg").textContent = err.message;
        setVisible("errorState", true);
      } finally {
        btn.textContent = "Search";
        btn.disabled = false;
      }
    }