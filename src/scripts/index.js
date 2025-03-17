const fileForm = document.forms["load-file"];
const fileInput = fileForm.elements["file"];

fileInput.addEventListener("change", (evt) => {
  const file = evt.target.files[0];
  const fileName = file.name.split(".").slice(0, -1).join(".");

  if (!file) {
    console.error("File not chosen!");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (evt) {
    const smText = evt.target.result;
    const sections = findSections(smText);

    const subsections = sections.map((section) => {
      return findSubsections(section);
    });

    const hits = findHits(subsections);

    const maps = generateMaps(hits);

    saveMaps(maps, fileName);
  };
  reader.readAsText(file);
});

function findSections(text) {
  const lines = text.split("\n");
  let sectionCount = 0;
  let previousSectionIndex = 0;
  let newSectionIndex = 0;

  const sections = lines
    .reduce((accumulator, line, index) => {
      if (line.trim() === "#NOTES:") {
        previousSectionIndex = newSectionIndex;
        newSectionIndex = index;

        accumulator[sectionCount] = lines.slice(
          previousSectionIndex + 6,
          newSectionIndex - 3
        );
        sectionCount++;
      }

      return accumulator;
    }, [])
    .slice(1);

  sections.push(lines.slice(newSectionIndex + 6, lines.length - 2));

  return sections;
}

function findSubsections(section) {
  const regExp = /,[\s\S]*\r/;

  let subSectionCount = 0;

  subSections = section.reduce(
    (accumulator, line) => {
      if (regExp.test(line)) {
        subSectionCount++;
        accumulator.push([]);
      } else {
        accumulator[subSectionCount].push(line);
      }

      return accumulator;
    },
    [[]]
  );

  return subSections;
}

function findHits(subSections) {
  hits = subSections.reduce((accumulator, diff, diffIndex) => {
    let currentBeat = 0;

    accumulator.push([]);

    diff.forEach((subsection) => {
      const passingRate = 4 / subsection.length;

      subsection.forEach((pattern) => {
        if (pattern !== "0000\r") {
          accumulator[diffIndex].push(currentBeat);
        }

        currentBeat += passingRate;
      });
    });

    return accumulator;
  }, []);

  return hits;
}

function generateMaps(hits) {
  const maps = hits.reduce((accumulator, diff) => {
    const map = diff.reduce((accumulatorNew, hit) => {
      return accumulatorNew + `${hit},\n`;
    }, "");
    accumulator.push(map);

    return accumulator;
  }, []);

  return maps;
}

function saveMaps(maps, fileName) {
  maps.forEach((map) => {
    let blob = new Blob([map], { type: "text/plain" });
    let link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  fileInput.value = "";
}
