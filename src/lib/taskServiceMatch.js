export function taskServiceCodes(task) {
  if (Array.isArray(task?.serviceCodes) && task.serviceCodes.length) {
    return task.serviceCodes.filter(Boolean);
  }
  return [];
}

export function technicianCoversTaskServices(technician, task) {
  const required = taskServiceCodes(task);
  if (!required.length) return true;
  const offered = Array.isArray(technician?.serviceCodes) ? technician.serviceCodes : [];
  return required.every((code) => offered.includes(code));
}

export function technicianCoverageHint(technician, task) {
  if (technicianCoversTaskServices(technician, task)) return '';
  return 'Não executa todos os serviços desta tarefa';
}
