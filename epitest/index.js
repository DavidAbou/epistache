const puppeteer = require('puppeteer')
const tesseract = require("node-tesseract-ocr")
const fs = require('node:fs').promises
const axios = require('axios').default
const env = require('dotenv')

env.config()
const ImgConfig = {
    lang: "eng",
    oem: 1,
    psm: 3,
}

function getSecondRelativeTo(startDate) {
    const now = new Date()
    return Math.floor((now.getTime() - startDate.getTime()) / 1000)
}

async function getRefreshedToken(email, password) {
    const startDate = new Date()
    console.log(getSecondRelativeTo(startDate) + ' Refreshing...')
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    var token = null

    page.setDefaultTimeout(60000)
    // Go to epitech page
    await page.goto('https://my.epitech.eu');

    // Click on login button
    await page.evaluate(() => {
        document.querySelector('a').click();
    })
    // Wait for the login page to load
    await page.waitForFrame(() => {
        return page.mainFrame().url().startsWith('https://login.microsoftonline.com/common/oauth2/authorize')
    })
    // Type email
    console.log(getSecondRelativeTo(startDate) + ' Login with: ' + email)
    const emailInput = await page.waitForSelector('[type^="email"]')
    await emailInput.type(email)
    // Click on next button
    await page.evaluate(() => {
        document.querySelector('input[type=submit]').click();
    });
    // Wait for epitech login page to load
    await page.waitForNavigation()
    await page.waitForNavigation()
    // Type password
    const passwordInput = await page.$('[type^="password"]')
    await passwordInput.type(password)
    // Click on submit button
    await page.evaluate(() => {
        document.querySelector('#submitButton').click();
    })
    // Wait for A2F page to request auth
    try {
        await page.waitForRequest('https://login.microsoftonline.com/common/SAS/BeginAuth')
    } catch {
        console.log(getSecondRelativeTo(startDate) + ' Wrong password...')
        await browser.close();
        return token
    }
    console.log(getSecondRelativeTo(startDate) + ' Check your phone...')

    // Wait for stay connected page to load
    try {
        // Wait for the auth number to be displayed
        await page.waitForSelector('.displaySign')
        setTimeout(async () => {
            // Take a screenshot of the auth number
            await page.screenshot({ path: 'a2f.png' })
            // Read the auth number
            const code = await tesseract.recognize('a2f.png', ImgConfig)
            console.log(getSecondRelativeTo(startDate) + ' Your confirmation code is: ' + code.match(/^\d{2}(?=\n)/gm)[0])
            // Delete the screenshot
            await fs.unlink('a2f.png')
        }, 2000)
        await page.waitForFrame(() => {
            return page.mainFrame().url() == "https://login.microsoftonline.com/common/SAS/ProcessAuth"
        })
    } catch {
        console.log(getSecondRelativeTo(startDate) + ' You take too much time to validate the auth request...')
        await browser.close();
        return token
    }

    // Click on proceed button
    console.log(getSecondRelativeTo(startDate) + ' Proceed...')
    const proceedButton = await page.waitForSelector('input[type=submit]')
    await proceedButton.click()
    // Wait for my.epitech.eu page to load
    await page.waitForNavigation()
    // Wait for token to be fetched
    console.log(getSecondRelativeTo(startDate) + ' Fetching for token...')
    token = await page.evaluate(() => localStorage.getItem('argos-api.oidc-token'))
    if (token == null) {
        console.log(getSecondRelativeTo(startDate) + ' Token not found...')
    } else {
        token = token.replace(/"/g, '')
    }
    await browser.close();
    return token
}

async function tryRequest(url) {
    var response = null
    env.config({ override: true })
    const token = process.env.EPI_TOKEN
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        headers: {
            'Authorization': 'Bearer ' + token
        }
    }

    try {
        response = await axios.get(url, config)
        return response.data
    } catch {
        const newToken = await getRefreshedToken(process.env.EPI_LOGIN, process.env.EPI_PASSWORD)
        await fs.writeFile('.env', `EPI_TOKEN='${newToken}'`)
        return await tryRequest(url)
    }
}

function getTotalPercent(project) {
    var total = 0
    var passed = 0

    for (const skill in project.results.skills) {
        total += project.results.skills[skill].count
        passed += project.results.skills[skill].passed
    }
    return (passed / total) * 100
}

function getSkillsPercent(project, skillName) {
    const skill = project.results.skills[skillName]
    return (skill.passed / skill.count) * 100
}

async function login(email, password) {
    const token = await getRefreshedToken(email, password)
    await fs.writeFile('.env', `EPI_TOKEN='${token}'`)
    process.stdout.write('Logged in as ' + email + ' !\n')
}

async function getProjects() {
    const projects = await tryRequest('https://api.epitest.eu/me/2022')

    for (const project of projects) {
        process.stdout.write(project.project.name + ': ' + getTotalPercent(project) + '%\n')
        for (const skill in project.results.skills) {
            process.stdout.write(' - ' + skill + ': ' + getSkillsPercent(project, skill) + '%\n')
        }
    }
}

async function run() {
    const cmds = {
        'getprojects': getProjects,
        'login': login,
        'logout': async () => {
            await fs.writeFile('.env', `EPI_TOKEN=''`)
            process.stdout.write('Logged out !\n')
        },
        'exit': async () => {
            process.stdout.write('Bye !\n')
            process.exit(0)
        }
    }

    process.stdin.setEncoding('utf8');
    process.stdout.write('> ')
    process.stdin.on('data', async (data) => {
        const cmdline = data.trim().split(' ');

        try {
            await cmds[cmdline[0].toLowerCase()](cmdline[1], cmdline[2])
        } catch (e) {
            process.stdout.write('Error: ' + e + '\n')
        }
        process.stdout.write('> ')
    });
}

run()
