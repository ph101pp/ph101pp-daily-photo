import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { TestDateTime } from "../typechain-types";

type TestCase = {
  ts: number,
  year: number
  month: number
  day: number
};

const testCases: TestCase[]=[
  {
    ts: 0,
    year: 1970,
    month: 1,
    day: 1
  }, 
  {
    ts: 1662044715,
    year: 2022,
    month: 9,
    day: 1
  },
  {
    ts: 594489915,
    year: 1988,
    month: 11,
    day: 2
  },
  {
    ts: 1636560315,
    year: 2021,
    month: 11,
    day: 10
  },
  {
    ts: 1513526715,
    year: 2017,
    month: 12,
    day: 17
  },
  {
    ts: 1385827515,
    year: 2013,
    month: 11,
    day: 30
  },
];

async function runTestCase(dateTime: TestDateTime, testCase: TestCase): Promise<void> {
  const epochTimestamp = await dateTime.timestampFromDate(
    testCase.year,
    testCase.month,
    testCase.day
  );
  const SECONDS_PER_DAY = 24 * 60 * 60;
  const dayTimestamp = testCase.ts - (testCase.ts%SECONDS_PER_DAY);
  expect(epochTimestamp).to.equal(dayTimestamp);
  const epochDate = await dateTime.timestampToDate(testCase.ts);
  expect(epochDate.year.toNumber()).to.equal(testCase.year);
  expect(epochDate.month.toNumber()).to.equal(testCase.month);
  expect(epochDate.day.toNumber()).to.equal(testCase.day);
}

describe("DateTime", function () {

  async function deployFixture() {
    const DT = await ethers.getContractFactory("DateTime");
    const dt = await DT.deploy();
    const DateTime = await ethers.getContractFactory("TestDateTime", {
      libraries: {
        "DateTime": dt.address
      }
    });
    const dateTime = await DateTime.deploy();
    return {dateTime};
  }

  it("Should correcly parse date test cases ", async function () {
    const { dateTime } = await loadFixture(deployFixture);
    for(const i in testCases) {
      await runTestCase(dateTime, testCases[i]);
    }
  });

});