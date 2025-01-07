import {promises as fs} from "fs";
import Mustache from "mustache";
import fetch from "node-fetch";

const {readFile, writeFile} = fs;

const MUSTACHE_MAIN_DIR = "./main.mustache";

async function updateReadme() {
    try {
        const data = await readFile(MUSTACHE_MAIN_DIR);
        const output = Mustache.render(data.toString(), DATA);
        await writeFile("README.md", output);
    } catch (e) {
        console.error(e);
    }
}

let DATA = {
    emoji: "👋",
    greeting: "Hello",
    bio: undefined,
    date: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
        timeZone: "UTC"
    }),
    latestContribution: "Couldn't fetch",
    ip: "Why the hell do you want this?",
    mostContributed: "Couldn't fetch",
    githubTime: "Couldn't fetch",
    repoCount: "Couldn't fetch",
    starCount: "Couldn't fetch",
    givenStarCount: "Couldn't fetch",
    error: "No errors. Hooray!",
    quote: {
        q: "I love when a good ol' problem occurs!",
        a: "Me"
    }
};

let errors = [];

if (Math.random() < 0.00001) {
    DATA.emoji = "🔫";
    DATA.greeting = "Goodbye";
}

function error(e) {
    console.error(e);
    errors.push(e);
    DATA.error = "\n\n".join(errors);
    updateReadme();
}

try {
    async function getBio(username) {
        const response = await fetch(`https://api.github.com/users/${username}`);
        const user = await response.json();
        return user.bio || "No bio available";
    }

    async function getLatestContribution(username) {
        const response = await fetch(`https://api.github.com/users/${username}/events/public`);
        const events = await response.json();
        const pushEvent = events.find(event => event.type === "PushEvent");
        if (!pushEvent) return undefined;

        const repoName = pushEvent.repo.name;
        return {created_at: pushEvent.created_at, repo: repoName};
    }

    async function getMostContributedProject(username) {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        const repos = await response.json();
        if (!repos.length) return "No contributions found";

        let mostContributedRepo = repos[0];
        for (const repo of repos) {
            if (repo.stargazers_count > mostContributedRepo.stargazers_count) {
                mostContributedRepo = repo;
            }
        }
        return mostContributedRepo.name;
    }

    async function getGithubTime(username) {
        const response = await fetch(`https://api.github.com/users/${username}`);
        const user = await response.json();
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const timeDiff = Math.abs(now - createdAt);
        const diffYears = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 365));
        const diffMonths = Math.floor(
            (timeDiff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
        );
        return `${diffYears} years and ${diffMonths} months`;
    }

    async function getRepoCount(username) {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        const repos = await response.json();
        return repos.length;
    }

    async function getStarCount(username) {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        const repos = await response.json();
        const starCount = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
        return starCount;
    }

    async function getGivenStarCount(username) {
        const response = await fetch(`https://api.github.com/users/${username}/starred`);
        const starredRepos = await response.json();
        return starredRepos.length;
    }

    async function getQuote() {
        const response = await fetch(`https://zenquotes.io/api/random`);
        return response.json();
    }

    getBio("Mesure73L").then(bio => {
        DATA.bio = bio;
        updateReadme();
    }).catch(e => {
        error(e);
        DATA.bio = undefined;
    });

    getLatestContribution("Mesure73L").then(latestContribution => {
        if (!latestContribution) return;

        const contributionDate = new Date(latestContribution.created_at);
        const now = new Date();
        const timeDiff = Math.abs(now - contributionDate);
        const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        DATA.latestContribution = `${diffDays} days ago`;

        if (diffDays == 0) {
            const diffHours = Math.ceil(timeDiff / (1000 * 60 * 60));
            if (diffHours == 0) {
                const diffMinutes = Math.ceil(timeDiff / (1000 * 60));
                DATA.latestContribution = `${diffMinutes} minutes ago`;
            } else {
                DATA.latestContribution = `${diffHours} hours ago`;
            }
        }

        DATA.latestContribution += ` in ${latestContribution.repo}`;

        updateReadme();
    }).catch(e => {
        error(e);
        DATA.latestContribution = "Couldn't fetch";
    });

    getMostContributedProject("Mesure73L").then(mostContributed => {
        DATA.mostContributed = mostContributed;
        updateReadme();
    }).catch(e => {
        error(e);
        DATA.mostContributed = "Couldn't fetch";
    });

    getGithubTime("Mesure73L").then(githubTime => {
        DATA.githubTime = githubTime;
        updateReadme();
    }).catch(e => {
        error(e);
        DATA.githubTime = "Couldn't fetch";
    });

    getRepoCount("Mesure73L").then(repoCount => {
        DATA.repoCount = repoCount;
        updateReadme();
    }).catch(e => {
        error(e);
        DATA.repoCount = "Couldn't fetch";
    });

    getStarCount("Mesure73L").then(starCount => {
        DATA.starCount = starCount;
        updateReadme();
    }).catch(e => {
        error(e);
        DATA.starCount = "Couldn't fetch";
    });

    getGivenStarCount("Mesure73L").then(givenStarCount => {
        DATA.givenStarCount = givenStarCount;
        updateReadme();
    }).catch(e => {
        error(e);
        DATA.givenStarCount = "Couldn't fetch";
    });

    getQuote().then(quote => {
        DATA.quote.q = quote[0].q.trim();
        DATA.quote.a = quote[0].a.trim();
        updateReadme();
    }).catch(e => {
        error(e);
        DATA.quote.q = "I love when a good ol' problem occurs!";
        DATA.quote.a = "Me";
    });
} catch (e) {
    error(e);
}

updateReadme();
