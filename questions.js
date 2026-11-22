// Single source of the questionnaire. Used by the form (index.html) and the results page (results.html).
// t = wording shown to respondents, s = wording shown to Prakash in self-rating, r = unfavourable wording (reverse scored).
window.SURVEY = {
  scale: [[1,"Almost never"],[2,"Rarely"],[3,"Sometimes"],[4,"Often"],[5,"Almost always"],[0,"Not observed"]],
  ice: [
    { id:"known", q:"How long have you known Prakash?", opts:[["lt2","Under 2 years"],["2to5","2 to 5 years"],["5to10","5 to 10 years"],["gt10","Over 10 years"]] },
    { id:"rel", q:"Have you worked with him?", hint:"Friends and family too: choose by whether you have worked with him. If more than one fits, pick \u201cBoth\u201d.", opts:[["client","Yes, he worked for me or my organisation"],["peer","Yes, we worked alongside each other"],["both","Both of the above"],["social","No, I know him personally or by reputation"]] },
    { id:"cricket", q:"In a game of cricket, where would you place him?", opts:[["opener","Opening batsman"],["allrounder","All-rounder"],["captain","Captain"],["umpire","Umpire"],["commentator","Commentator"],["twelfth","12th man (non-playing)"],["audience","In the audience"]] }
  ],
  behaviour: [
    { id:"b1", t:"He lets others finish speaking before he responds.", s:"I let others finish speaking before I respond." },
    { id:"b2", t:"He asks questions to understand a view before responding to it.", s:"I ask questions to understand a view before responding to it." },
    { id:"b3", r:true, t:"His tone sharpens when someone disagrees with him.", s:"My tone sharpens when someone disagrees with me." },
    { id:"b4", r:true, t:"He brings up an issue again after the group has already decided on it.", s:"I bring up an issue again after the group has already decided on it." },
    { id:"b5", t:"After a decision goes against his view, he carries it out without reopening it.", s:"After a decision goes against my view, I carry it out without reopening it." },
    { id:"b6", r:true, t:"He corrects people in front of others.", s:"I correct people in front of others." },
    { id:"b7", t:"He says so when someone else's point is better than his.", s:"I say so when someone else's point is better than mine." },
    { id:"b8", t:"When his own work is questioned, he responds to the point without getting defensive.", s:"When my own work is questioned, I respond to the point without getting defensive." },
    { id:"b9", r:true, t:"His messages or emails come across as rude or taunting.", s:"My messages or emails come across as rude or taunting." },
    { id:"b10", t:"Junior colleagues question or contradict him in his presence.", s:"Junior colleagues question or contradict me in my presence." }
  ],
  situ: [
    { id:"s1", q:"In a disagreement, he most often…", sq:"In a disagreement, I most often…", opts:[["yield","Gives way early"],["once","States his view once and moves on"],["argue","Argues until the point is settled his way"]] },
    { id:"s2", q:"When he thinks someone is wrong, he most often…", sq:"When I think someone is wrong, I most often…", opts:[["silent","Says nothing"],["private","Raises it privately"],["group","Raises it in front of the group"]] }
  ],
  adjectives: {
    pos: ["Thorough","Dependable","Knowledgeable","Sticks to his principles","Generous","Approachable","Patient","Encouraging","Practical","Humble","Clear","Fair"],
    neg: ["Blunt","Impatient","Rigid","Argumentative","Intimidating","Brushes people off","Stubborn","Taunting","Defensive","Bossy","Distant","Short-tempered"]
  },
  work: [
    { id:"w1", t:"I could use his reports as submitted, without rewriting sections.", s:"Clients can use my reports as submitted, without rewriting sections." },
    { id:"w2", t:"His findings gave me something I could act on.", s:"My findings give clients something they can act on." },
    { id:"w3", t:"When field conditions or data did not go to plan, he came with a workable alternative.", s:"When field conditions or data do not go to plan, I come with a workable alternative." },
    { id:"w4", t:"He delivered on the agreed dates.", s:"I deliver on the agreed dates." },
    { id:"w5", r:true, t:"I had to follow up with him to get things done.", s:"People have to follow up with me to get things done." },
    { id:"w6", t:"He explained his method in a way I could repeat to my own seniors.", s:"I explain my method in a way clients can repeat to their own seniors." },
    { id:"w7", t:"He told me early when something would be late or could not be done.", s:"I tell people early when something will be late or cannot be done." },
    { id:"w8", t:"He replied to messages within a working day.", s:"I reply to messages within a working day." }
  ],
  comp: { id:"w_comp", q:"Compared with consultants of similar seniority you have worked with, his work is…", sq:"Compared with consultants of similar seniority, my work is…", opts:[["best","Among the best"],["above","Above average"],["avg","Average"],["below","Below average"]] },
  first: { id:"first", q:"For which kinds of work would you think of him first?", sq:"For which kinds of work do I expect people to think of me first?", hint:"Choose all that apply.", opts:[["baseline","Baseline or evaluation studies"],["mne","M&E systems"],["training","Training and facilitation"],["proposal","Proposal development"],["csr","CSR programme design"],["audit","Social audit"],["livelihoods","Livelihoods planning"],["none","None of these"]] },
  rec: { id:"rec", q:"How likely are you to recommend him for an assignment?" },
  again: { id:"again", q:"Would you work with him again?", qn:"Would you want to work with him?", opts:[["yes","Yes"],["reservations","Yes, with reservations"],["no","No"]] },
  resv: { id:"resv", q:"What is your main reservation?", opts:[["manner","His manner"],["fit","Fit of his skills with my needs"],["availability","His availability"],["nowork","No relevant work at present"],["unsure","Unsure what he currently offers"],["other","Something else"]] },
  held: { id:"held", q:"Have you ever held back from recommending him?", opts:[["yes","Yes"],["no","No"]] }
};
