// npm init -y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib
// node project.js  --dest=team.csv  --target=WorldCup  --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results

let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let fs = require("fs");
let pdf = require("pdf-lib");
const { stringify } = require("querystring");
let args = minimist(process.argv);

//console.log(args.source);
//console.log(args.dest);

let downloadpromise = axios.get(args.source);


downloadpromise.then(function (response) {

    let html = response.data;
    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;

    let matchBlock = document.querySelectorAll("div.match-score-block");
    let matches = [];



    for (let i = 0; i < matchBlock.length; i++) {
        let match = {};


        //     let name = matchBlock[i].querySelectorAll(" .match >  .teams  > .name") ;
        // // console.log(name[0].textContent +" "+ name[1].textContent);
        //     console.log(name.textcontent);
        let name = matchBlock[i].querySelectorAll(" .teams .team .name");

        // name
        match.t1 = name[0].textContent;
        match.t2 = name[1].textContent;

        //score
        let score = matchBlock[i].querySelectorAll(".score-detail .score");

        match.score1 = "";
        match.score2 = "";

        if (score.length == 2) {
            match.score1 = score[0].textContent;
            match.score2 = score[1].textContent;
        }
        else if (score.length == 1) {
            match.score1 = score[0].textContent;
            match.score2 = " ";
        }
        else {

            match.score1 = "";
            match.score2 = "";

        }

        // result 
        let temp = matchBlock[i].querySelector(" .status-text span ");
        match.result = temp.textContent;
        // console.log(match.result);


        matches.push(match);
    }
    //console.log(matches);
    // writing json file
    let matchesjson = JSON.stringify(matches);
    fs.writeFileSync("matches.json", matchesjson, "utf-8");

    // printing json file console.log(matches.matchesjson);

    let teams = [];

    for (let i = 0; i < matches.length; i++) {
        putteams(teams, matches[i]);
    }

    for (let i = 0; i < matches.length; i++) {
        putmatchesinplace(teams, matches[i]);
    }

    // console.log(teams); this would give error
    let tempe = JSON.stringify(teams);
    fs.writeFileSync("tempe.json",tempe,"utf-8");
     //console.log(tempe);



        // created excel 
    let wb = new excel.Workbook();
     for(let i=0;i<teams.length;i++)
     {
         let sheet = wb.addWorksheet(teams[i].name);
            sheet.cell(1,1).string("OPPONENT");
            sheet.cell(1,2).string("SELF-SCORE");
            sheet.cell(1,3).string("OPP-SCORE");
            sheet.cell(1,4).string("RESULT");

            for(let j=0;j<teams[i].matches.length;j++)
            {
                let vs = teams[i].matches[j].vs;
                sheet.cell(2+j,1).string(vs);
                let selfscore = teams[i].matches[j].selfscore;
                sheet.cell(2+j,2).string(selfscore);
                let oppscore= teams[i].matches[j].oppscore;
                sheet.cell(2+j,3).string(oppscore);
                let result = teams[i].matches[j].result;
                sheet.cell(2+j,4).string(result);
            }

     }
    wb.write(args.dest);  // writing excel


    //making folder 
    let path = require("path");

    //let mainfolder = path.join("PROJECT","WorldCup");
    //fs.mkdirSync("project"+"/"+args.target);

    
    
    for(let i=0;i<teams.length;i++)
    {
        let folderName= path.join("WorldCup",teams[i].name);
        fs.mkdirSync(folderName);

        for(let  j=0;j<teams[i].matches.length;j++)
        {
            //console.log("any");
           let matchfilename = path.join(folderName,teams[i].matches[j].vs+".pdf");
           //console.log(matchfilename); 
          createScoreCard(teams[i].name,teams[i].matches[j],matchfilename);
        }

    }




}).catch(function (err) {
    console.log(err);
});



// function putMatchInAppropriateTeam(teams, match) {
//     let t1idx = -1;
//     for (let i = 0; i < teams.length; i++) {
//         if (teams[i].name == match.t1) {
//             t1idx = i;
//             break;
//         }
//     }

//     let team1 = teams[t1idx];
//     team1.matches.push({
//         vs: match.t2,
//         selfScore: match.t1s,
//         oppScore: match.t2s,
//         result: match.result
//     });

//     let t2idx = -1;
//     for (let i = 0; i < teams.length; i++) {
//         if (teams[i].name == match.t2) {
//             t2idx = i;
//             break;
//         }
//     }

//     let team2 = teams[t2idx];
//     team2.matches.push({
//         vs: match.t1,
//         selfScore: match.t2s,
//         oppScore: match.t1s,
//         result: match.result
//     });
// }

function putteams(teams, match) {

    let t1idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (match.t1 == teams[i].name) {
            t1idx = i;
            break;
        }
    }

    if (t1idx == -1) {
        teams.push({
            name: match.t1,
            matches: []
        })
    }

    let t2idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (match.t2 == teams[i].name) {
            t2idx = i;
            break;
        }
    }
    if (t2idx == -1) {
        teams.push({
            name: match.t2,
            matches: []
        })
    }

}

function putmatchesinplace(teams, match) {

    let t1idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t1) {
            t1idx = i;
            break;
        }
    }

    let t1teams = teams[t1idx];
    t1teams.matches.push({
        vs: match.t2,
        selfscore: match.score1,
        oppscore: match.score2,
        result: match.result,
    });



    let t2idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t2) {
            t2idx = i;
            break;
        }
    }

    let t2teams = teams[t2idx];
    t2teams.matches.push({
        vs: match.t1,
        selfscore: match.score2,
        oppscore: match.score1,
        result: match.result,
    });

}

function createScoreCard(teamName,match,matchfilename)
{
    let t1 = teamName;
    let t2 = match.vs;
    let t1s = match.selfscore;
    let t2s = match.oppscore;
    let result = match.result;

    let originalbytes = fs.readFileSync("template.pdf");

    let pdfkapromise = pdf.PDFDocument.load(originalbytes);

    pdfkapromise.then(function(pdfdoc)
    {
        let page = pdfdoc.getPage(0);
        page.drawText(t1,{
            x: 320 ,
            y: 715,
            size: 15
        });

        page.drawText(t2,{
            x: 320 ,
            y: 685,
            size: 15
        });

        page.drawText(t1s,{
            x: 320 ,
            y: 650,
            size: 15
        });

        page.drawText(t2s,{
            x: 320 ,
            y: 620,
            size: 15
        });

        page.drawText(result,{
            x: 220 ,
            y: 585,
            size: 15
        });

        let promisetosave = pdfdoc.save();
        promisetosave.then(function(changedbytes)
        {
            console.log(matchfilename,changedbytes);
                fs.writeFileSync(matchfilename,changedbytes);
        })
        

        


    })  // promise end


}

