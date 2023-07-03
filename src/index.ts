import { spawn } from "child_process";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const waitingForKeyPress = async () => {
  process.stdin.setRawMode(true);
  return new Promise<void>((resolve) =>
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false);
      resolve();
    })
  );
};

async function readyGit() {
  const { simpleGit } = await import("simple-git");
  return simpleGit();
}

import("inquirer").then(async ({ createPromptModule }) => {
  const prompt = createPromptModule();
  const git = await readyGit();

  const currentBranchName = (await git.branchLocal()).current;
  const slashSeparatedBranchName = currentBranchName.split("/");

  const ticketNumbers = slashSeparatedBranchName.filter((branchName) =>
    branchName.startsWith("MP-")
  );

  console.log("\n\n\n-------------------");
  console.log("Mathpang Commit Kit");
  console.log("-------------------\n");

  console.log(`현재 브랜치: ${currentBranchName}`);

  const { type, ticket, tag, subject, body } = await prompt([
    {
      message: "타입을 선택해주세요.",
      name: "type",
      type: "list",
      choices: [
        {
          name: "🚀 feat (새로운 기능)",
          value: "🚀 feat",
        },
        {
          name: "🐛 fix (버그 수정)",
          value: "🐛 fix",
        },
        {
          name: "📝 docs (문서 수정)",
          value: "📝 docs",
        },
        {
          name: "🎨 UI/UX (UI/UX 수정)",
          value: "🎨 ui/ux",
        },
        {
          name: "💎 style (코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우)",
          value: "💎 style",
        },
        {
          name: "💡 refactor (코드 리팩토링)",
          value: "💡 refactor",
        },
        {
          name: "🦑 test (테스트 코드)",
          value: "🦑 test",
        },
        {
          name: "🧹 chore (빌드 업무 수정, 패키지 매니저 수정)",
          value: "🧹 chore",
        },
        {
          name: "🎶 etc (기타)",
          value: "🎶 etc",
        },
      ],
    },

    {
      message: "지라 티켓을 입력해주세요.",
      name: "ticket",
      default: ticketNumbers.map((t) => `[${t}]`).join(" "),
    },

    {
      message: "태그를 입력해주세요.",
      name: "tag",
    },

    {
      message: "제목을 입력해주세요.",
      name: "subject",
    },

    {
      message: "본문을 입력해주세요.",
      name: "body",
      type: "editor",
    },
  ]);

  const commitTitle = `${type} (${tag}): ${ticket} ${subject}`;

  console.log("\n\n------------------------------");
  console.log(`${commitTitle}\n${body.trim()}`);
  console.log("\n\n------------------------------");

  const { commit, push } = await prompt([
    {
      message: "커밋을 진행하시겠습니까?",
      name: "commit",
      type: "confirm",
    },
    {
      message: "푸시도 함께 진행하시겠습니까?",
      name: "push",
      type: "confirm",
    },
  ]);

  if (commit) {
    await git.commit(`${commitTitle}\n${body.trim()}`);

    if (push) {
      await git.push();
    }
  }
});
