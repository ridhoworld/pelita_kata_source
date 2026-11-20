<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('articles:publish-scheduled')->everyMinute();
Schedule::command('articles:prune-draft-revisions')->dailyAt('02:30');
