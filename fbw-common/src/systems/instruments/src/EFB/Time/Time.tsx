// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import {t } from '@flybywiresim/flypad';

const today = new Date();
export const Time = () => {


  return (
    <div className="transform-gpu">
      <div className="relative mb-4">
        <h1 className="font-bold">{t('Time.Title')}</h1>
        <div className="mr-4 flex h-content-section-reduced w-full items-center justify-center overflow-x-hidden">
        <p className="mb-6 pt-6 text-3xl">{t('Time.ActualTimeIs') + today}</p>
    </div>
      </div>
    </div>
  );
};
