import { TaskService } from './src/services/TaskService';
async function run() {
  try {
    const tasks = await TaskService.getTasks();
    console.log(tasks);
  } catch (e) {
    console.error(e);
  }
}
run();
