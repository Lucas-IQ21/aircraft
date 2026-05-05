import { EngineModelParameters, FlightModelParameters } from '@fmgc/flightplanning/AircraftConfigTypes';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';
import { FlightModel } from '@fmgc/guidance/vnav/FlightModel';
import { Common, FlapConf } from '@fmgc/guidance/vnav/common';

export class Lrc {
  private weightLbs: number;

  constructor(
    private fmConfig: FlightModelParameters,
    private engineConfig: EngineModelParameters,
    opts: {
      GW_kg: number;
      pressureAltitudeFt: number;
      delta: number;
      theta: number;
      machMin: number;
      machMax: number;
      machStep: number;
      costIndex?: number;
    },
  ) {
    this.weightLbs = opts.GW_kg * 2.204625;
    this.altitudeFt = opts.pressureAltitudeFt;
    this.delta = opts.delta;
    this.theta = opts.theta;
    this.machMin = opts.machMin;
    this.machMax = opts.machMax;
    this.machStep = opts.machStep;
    this.costIndex = opts.costIndex ?? 0;
  }

  private altitudeFt: number;
  private delta: number;
  private theta: number;
  private costIndex: number;

  machMin: number;
  machMax: number;
  machStep: number;

  /**
   * Inversion numérique FBW de table1506
   * Trouve le CN1 donnant la thrust corrigée requise
   */
  private findCn1ForThrust(thrustRequired: number, mach: number): number {
    const table = this.engineConfig.table1506;
    let prevCn1 = table[1][0];
    let prevThrust = EngineModel.tableInterpolation(table, prevCn1, mach);
    for (let i = 2; i < table.length; i++) {
      const cn1 = table[i][0];
      const thrust = EngineModel.tableInterpolation(table, cn1, mach);
      if (thrust >= thrustRequired) {
        return Common.interpolate(thrustRequired, prevThrust, thrust, prevCn1, cn1);
      }
      prevCn1 = cn1;
      prevThrust = thrust;
    }
    return table[table.length - 1][0];
  }

  computeSRforMach(mach: number): number {
    const drag = FlightModel.getDrag(this.fmConfig, this.weightLbs, mach, this.delta, false, false, FlapConf.CLEAN);
    const thrustPerEngine = drag / this.engineConfig.numberOfEngines;
    const cn1 = this.findCn1ForThrust(thrustPerEngine, mach);
    const ffCorr =
      EngineModel.getCorrectedFuelFlow(this.engineConfig, cn1, mach, this.altitudeFt) * (1 + 0.6 * (mach - 0.75)); // a remove potentiellement
    const ff = EngineModel.getUncorrectedFuelFlow(ffCorr, this.delta, this.theta);
    const totalFF = (ff * this.engineConfig.numberOfEngines) / 3600; // lb/s

    if (!Number.isFinite(drag) || drag <= 0) {
      return 0;
    }
    if (!Number.isFinite(totalFF) || totalFF <= 0) {
      return 0;
    }

    const tasKt = mach * 661 * Math.sqrt(this.theta);

    console.log({
      mach,
      drag,
      ff,
      tas: tasKt,
      sr: tasKt / ff,
    });
    return tasKt / 3600 / totalFF;
  }

  computeLRC() {
    let bestSR = 0;
    let M_mrc = this.machMin;

    // A remove :
    console.group('LRC DEBUG');
    const debugData = [];
    for (let M = this.machMin; M <= this.machMax + 1e-9; M += this.machStep) {
      const SR = this.computeSRforMach(M);

      debugData.push({
        Mach: Number(M.toFixed(3)),
        SR: Number(SR.toFixed(6)),
      });
    }
    console.table(debugData);

    // MRC
    for (let M = this.machMin; M <= this.machMax + 1e-9; M += this.machStep) {
      const SR = this.computeSRforMach(M);
      if (SR > bestSR) {
        bestSR = SR;
        M_mrc = M;
      }
    }

    // LRC
    const epsilon = 0.01 + 0.0003 * this.costIndex;
    const SR_target = (1 - epsilon) * bestSR;
    let M_lrc = M_mrc;
    for (let M = M_mrc; M <= this.machMax + 1e-9; M += this.machStep) {
      if (this.computeSRforMach(M) >= SR_target) {
        M_lrc = M;
      }
    }
    return {
      M_mrc: Number(M_mrc.toFixed(2)),
      M_lrc: Number(M_lrc.toFixed(2)),
      SR_max: bestSR,
    };
  }
}
