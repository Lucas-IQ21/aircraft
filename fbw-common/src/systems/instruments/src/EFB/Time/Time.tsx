// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { Navbar, t, PageLink, PageRedirect, TabRoutes } from '@flybywiresim/flypad';
import { ServicesPage } from '../Ground/Pages/Services/ServicesPage';
import { PushbackPage } from '../Ground/Pages/Pushback/PushbackPage';
import { PayloadPage } from '../Ground/Pages/Payload/PayloadPage';
import { Fuel } from '../Ground/Pages/Fuel/Fuel'

export const Time = () => {
  const tabs: PageLink[] = [
    { name: 'Services', alias: t('Ground.Services.Title'), component: <ServicesPage /> },
    { name: 'Fuel', alias: t('Ground.Fuel.Title'), component: <Fuel /> },
    { name: 'Payload', alias: t('Ground.Payload.Title'), component: <PayloadPage /> },
    { name: 'Pushback', alias: t('Ground.Pushback.Title'), component: <PushbackPage /> },
  ];

  return (
    <div className="transform-gpu">
      <div className="relative mb-4">
        <h1 className="font-bold">{t('Time.Title')}</h1>
        <Navbar className="absolute right-0 top-0" tabs={tabs} basePath="/time" />
      </div>
      <PageRedirect basePath="/time" tabs={tabs} />
      <TabRoutes basePath="/time" tabs={tabs} />
    </div>
  );
};
