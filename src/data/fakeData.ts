function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

export function createTicketData() {
  return {
    title: `Support request ${randomItem(["billing", "login", "chat", "setup", "access"])} ${randomInt(100, 999)}`,
    description: `This is a generated test ticket for ${randomItem(["billing", "access", "integration", "performance"])}.`,
    origin: randomItem(["Web", "Email", "Chat"]),
    priority: randomItem(["Low", "Medium", "High"]),
  };
}

export function createReplyData() {
  return {
    content: `Automated follow-up ${randomInt(1, 99)} for validation.`,
  };
}

export function createCustomerEmail() {
  return `qa.customer.${randomInt(100000, 999999)}@example.test`;
}

export function createUserData() {
  return {
    firstName: randomItem(["Ava", "Noah", "Mia", "Liam"]),
    lastName: randomItem(["Lee", "Brown", "Patel", "Nguyen"]),
    email: `qa${randomInt(1, 99)}@example.test`,
  };
}
