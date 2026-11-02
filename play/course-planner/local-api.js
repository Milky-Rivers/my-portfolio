(() => {
  const STORAGE_KEY = "course-planner-github-pages-v1";
  const nativeFetch = window.fetch.bind(window);
  window.COURSE_PLANNER_STATIC = true;

  const DEFAULT_PERIODS = [
    ["08:30", "09:15"], ["09:20", "10:05"], ["10:20", "11:05"], ["11:10", "11:55"],
    ["13:30", "14:15"], ["14:20", "15:05"], ["15:20", "16:05"], ["16:10", "16:55"],
    ["18:00", "18:45"], ["18:45", "19:30"], ["19:40", "20:25"], ["20:25", "21:10"],
  ].map(([start_time, end_time], index) => ({
    slot: index + 1,
    start_time,
    end_time,
  }));

  const SAMPLE_COURSES = [
    ["大学英语I", "管小繁", "志学楼-B404", 1, 1, 2, 4, 16, "even", "#1d4ed8"],
    ["管理学", "孔晓丹", "志学楼-205", 1, 5, 6, 4, 4, "even", "#b45309"],
    ["管理学", "宋杨", "志学楼-205", 1, 5, 6, 6, 16, "even", "#b45309"],
    ["体育I", "叶泽峰", "室外篮球场4", 1, 7, 8, 1, 16, "all", "#0e7357"],
    ["Python程序设计", "汤冬劼", "志学楼-B401", 2, 3, 4, 3, 16, "all", "#0f766e"],
    ["军事理论", "克依沙尔·艾尼娃", "志学楼-阶梯1", 2, 9, 10, 3, 16, "all", "#4338ca"],
    ["大学英语I", "管小繁", "志学楼-307", 3, 3, 4, 3, 16, "all", "#1d4ed8"],
    ["思想道德与法治", "杨寄荣", "志学楼-阶梯3", 3, 5, 6, 4, 16, "even", "#9d174d"],
    ["政治学原理", "娄万锁", "志学楼-103", 3, 7, 8, 3, 16, "all", "#6d28d9"],
    ["大学语文", "杨国明", "志学楼-202", 4, 1, 2, 3, 16, "all", "#0369a1"],
    ["思想道德与法治", "杨寄荣", "志学楼-阶梯3", 4, 3, 4, 3, 16, "all", "#9d174d"],
    ["高等数学B(I)", "董文强", "志学楼-105", 4, 5, 6, 3, 16, "all", "#0369a1"],
    ["大学生心理健康", "宣红萍", "志学楼-阶梯3", 4, 7, 8, 3, 16, "all", "#b45309"],
    ["管理学", "孔晓丹", "志学楼-311（智慧教室）", 5, 3, 4, 3, 4, "all", "#b45309"],
    ["管理学", "宋杨", "志学楼-311（智慧教室）", 5, 3, 4, 5, 16, "all", "#b45309"],
    ["高等数学B(I)", "董文强", "志学楼-105", 5, 5, 6, 3, 15, "odd", "#0369a1"],
    ["形势与政策I", "曾怡", "志学楼-阶梯3", 4, 9, 10, 3, 9, "odd", "#4338ca"],
  ];

  function isoDate(offset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  function makeCourses() {
    const createdAt = new Date().toISOString();
    return SAMPLE_COURSES.map((course, index) => ({
      id: index + 1,
      name: course[0],
      teacher: course[1],
      location: course[2],
      weekday: course[3],
      start_slot: course[4],
      end_slot: course[5],
      week_start: course[6],
      week_end: course[7],
      week_parity: course[8],
      color: course[9],
      created_at: createdAt,
    }));
  }

  function makeAssignments() {
    const createdAt = new Date().toISOString();
    return [
      {
        id: 1,
        course_id: 12,
        title: "习题 3.1 - 3.5",
        detail: "第三章课后题",
        due_date: isoDate(1),
        done: 0,
        created_at: createdAt,
      },
      {
        id: 2,
        course_id: 1,
        title: "Unit 1 作文",
        detail: "提交到课程平台",
        due_date: isoDate(4),
        done: 0,
        created_at: createdAt,
      },
    ];
  }

  function seedData() {
    return {
      courses: makeCourses(),
      assignments: makeAssignments(),
      periods: DEFAULT_PERIODS.map((period) => ({ ...period })),
      termStart: "2026-09-07",
      nextCourseId: 18,
      nextAssignmentId: 3,
    };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.courses) && Array.isArray(saved.assignments)) return saved;
    } catch {
      // Invalid local data falls back to the built-in schedule.
    }
    const data = seedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function bodyOf(options) {
    if (!options?.body) return {};
    if (typeof options.body === "string") {
      try {
        return JSON.parse(options.body);
      } catch {
        return {};
      }
    }
    if (options.body instanceof FormData) return Object.fromEntries(options.body.entries());
    return {};
  }

  function json(data, status = 200) {
    return Promise.resolve(new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    }));
  }

  function toCourse(body, id) {
    return {
      id,
      name: String(body.name ?? "").trim(),
      teacher: String(body.teacher ?? "").trim(),
      location: String(body.location ?? "").trim(),
      weekday: Number(body.weekday),
      start_slot: Number(body.startSlot),
      end_slot: Number(body.endSlot),
      week_start: Number(body.weekStart),
      week_end: Number(body.weekEnd),
      week_parity: ["all", "odd", "even"].includes(body.weekParity) ? body.weekParity : "all",
      color: String(body.color ?? "#0e7357"),
      created_at: new Date().toISOString(),
    };
  }

  function hasParityOverlap(a, b) {
    return a.week_parity === "all" || b.week_parity === "all" || a.week_parity === b.week_parity;
  }

  function courseConflicts(candidate, courses) {
    return courses.filter((course) => (
      course.id !== candidate.id
      && course.weekday === candidate.weekday
      && candidate.start_slot <= course.end_slot
      && candidate.end_slot >= course.start_slot
      && candidate.week_start <= course.week_end
      && candidate.week_end >= course.week_start
      && hasParityOverlap(candidate, course)
    ));
  }

  async function handleApi(url, options) {
    const method = String(options?.method || "GET").toUpperCase();
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const data = load();

    if (path === "/api/me" && method === "GET") {
      return json({ hasAccount: true, loggedIn: true });
    }
    if (path === "/api/logout" && method === "POST") {
      return json({ ok: true });
    }
    if (path === "/api/courses" && method === "GET") {
      const courses = [...data.courses].sort((a, b) =>
        a.weekday - b.weekday || a.start_slot - b.start_slot || a.id - b.id);
      return json({ courses });
    }
    if (path === "/api/courses" && method === "POST") {
      const body = bodyOf(options);
      const course = toCourse(body, data.nextCourseId++);
      const conflicts = courseConflicts(course, data.courses);
      if (conflicts.length && !body.force) {
        return json({ error: "课程时间冲突", conflicts }, 409);
      }
      data.courses.push(course);
      save(data);
      return json({ id: course.id }, 201);
    }

    const courseMatch = path.match(/^\/api\/courses\/(\d+)$/);
    if (courseMatch) {
      const id = Number(courseMatch[1]);
      const index = data.courses.findIndex((course) => course.id === id);
      if (method === "PUT") {
        const body = bodyOf(options);
        const course = toCourse(body, id);
        const conflicts = courseConflicts(course, data.courses);
        if (conflicts.length && !body.force) {
          return json({ error: "课程时间冲突", conflicts }, 409);
        }
        if (index >= 0) {
          course.created_at = data.courses[index].created_at;
          data.courses[index] = course;
        } else {
          data.courses.push(course);
        }
        save(data);
        return json({ ok: true });
      }
      if (method === "DELETE") {
        data.courses = data.courses.filter((course) => course.id !== id);
        save(data);
        return json({ ok: true });
      }
    }

    if (path === "/api/assignments" && method === "GET") {
      const courses = new Map(data.courses.map((course) => [course.id, course]));
      const assignments = data.assignments.map((assignment) => {
        const course = courses.get(assignment.course_id);
        return {
          ...assignment,
          course_name: course?.name ?? null,
          course_color: course?.color ?? null,
        };
      }).sort((a, b) =>
        Number(a.done) - Number(b.done)
        || a.due_date.localeCompare(b.due_date)
        || b.id - a.id);
      return json({ assignments });
    }
    if (path === "/api/assignments" && method === "POST") {
      const body = bodyOf(options);
      const assignment = {
        id: data.nextAssignmentId++,
        course_id: body.courseId ? Number(body.courseId) : null,
        title: String(body.title ?? "").trim(),
        detail: String(body.detail ?? "").trim(),
        due_date: String(body.dueDate ?? ""),
        done: 0,
        created_at: new Date().toISOString(),
      };
      data.assignments.push(assignment);
      save(data);
      return json({ id: assignment.id }, 201);
    }

    const assignmentMatch = path.match(/^\/api\/assignments\/(\d+)$/);
    if (assignmentMatch) {
      const id = Number(assignmentMatch[1]);
      const assignment = data.assignments.find((item) => item.id === id);
      if (!assignment) return json({ error: "作业不存在" }, 404);
      if (method === "PATCH") {
        assignment.done = bodyOf(options).done ? 1 : 0;
        save(data);
        return json({ ok: true, done: Boolean(assignment.done) });
      }
      if (method === "DELETE") {
        data.assignments = data.assignments.filter((item) => item.id !== id);
        save(data);
        return json({ ok: true });
      }
    }

    if (path === "/api/settings" && method === "GET") {
      return json({ termStart: data.termStart });
    }
    if (path === "/api/settings" && method === "PUT") {
      data.termStart = String(bodyOf(options).termStart ?? "");
      save(data);
      return json({ ok: true });
    }

    if (path === "/api/periods" && method === "GET") {
      return json({ periods: data.periods });
    }
    if (path === "/api/periods" && method === "PUT") {
      const periods = bodyOf(options).periods;
      if (!Array.isArray(periods) || periods.length !== 12) {
        return json({ error: "需要提供 12 个节次的时间" }, 400);
      }
      data.periods = periods.map((period) => ({
        slot: Number(period.slot),
        start_time: period.start,
        end_time: period.end,
      }));
      save(data);
      return json({ ok: true });
    }

    if (path === "/api/demo-data" && method === "POST") {
      if (data.courses.length) return json({ error: "已经有课程了，先清空再试" }, 400);
      const seeded = seedData();
      seeded.periods = data.periods;
      seeded.termStart = data.termStart;
      save(seeded);
      return json({ ok: true }, 201);
    }
    if (path === "/api/data/clear" && method === "POST") {
      data.courses = [];
      data.assignments = [];
      data.nextCourseId = 1;
      data.nextAssignmentId = 1;
      save(data);
      return json({ ok: true });
    }

    return json({ error: "接口不存在" }, 404);
  }

  window.fetch = async (input, options = {}) => {
    const requestUrl = typeof input === "string" ? input : input.url;
    const path = requestUrl.split(/[?#]/, 1)[0];
    if (!path.startsWith("/api/")) return nativeFetch(input, options);
    return handleApi(new URL(path, "http://course-planner.local"), options);
  };
})();
