package com.ustarenovasyon.boxantrenman;

import static org.junit.Assert.*;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;
import androidx.lifecycle.Lifecycle;
import android.os.SystemClock;
import java.util.concurrent.CountDownLatch;
import java.io.ByteArrayOutputStream;
import java.util.regex.Pattern;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class OfflineAppTest {
    @Rule public ActivityScenarioRule<MainActivity> activity=new ActivityScenarioRule<>(MainActivity.class);
    private String js(String code) throws Exception {
        CountDownLatch done=new CountDownLatch(1);String[] value={null};
        activity.getScenario().onActivity(host->{assertNotNull("WebView must be available",host.getAppWebView());host.getAppWebView().evaluateJavascript(code,result->{value[0]=result;done.countDown();});});
        assertTrue("JavaScript callback",done.await(10,TimeUnit.SECONDS));return value[0];
    }
    private String body() throws Exception {Object value=new JSONTokener(js("document.body.innerText")).nextValue();return String.valueOf(value);}
    private void contains(String text) throws Exception {for(int i=0;i<120;i++){if(body().contains(text))return;SystemClock.sleep(200);}fail("Missing UI: "+text+"; actual: "+body());}
    private void click(String tag,String text) throws Exception {
        String code="(function(){var e=Array.from(document.querySelectorAll("+JSONObject.quote(tag)+")).find(e=>e.textContent.trim()==="+JSONObject.quote(text)+");if(e){e.click();return true;}return false;})()";
        for(int i=0;i<100;i++){if("true".equals(js(code))){SystemClock.sleep(200);return;}SystemClock.sleep(200);}fail("Missing control: "+text+"; "+body());
    }
    private void nativeClick(String tag,String text) throws Exception {
        assertEquals("true",js("(function(){var e=Array.from(document.querySelectorAll("+JSONObject.quote(tag)+")).find(e=>e.textContent.trim()==="+JSONObject.quote(text)+");if(!e)return false;e.scrollIntoView({block:'center'});return true;})()"));
        SystemClock.sleep(500);UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        UiObject2 target=device.wait(Until.findObject(By.text(text).clickable(true)),5000);
        if(target==null)target=device.wait(Until.findObject(By.desc(text).clickable(true)),2000);
        assertNotNull("Native touch control: "+text,target);target.click();SystemClock.sleep(250);
    }
    @Test public void offlineProgramTimerNativeBackupAndRestore() throws Exception {
        contains("İlk antrenman programını oluştur.");assertEquals("true",js("typeof window.BoxAndroid.postMessage==='function'"));
        nativeClick("a","Yeni program oluştur");click("button","Sadece Boks");contains("Program Süresi");click("button","1 Ay");click("button","1");click("button","Pazartesi");click("button","Başlangıç");click("button","Sol Gard (Orthodox)");click("button","Program Oluştur");contains("Program Önizleme");click("button","Programı Gözden Geçir");click("button","Onayla ve Programı Başlat");click("button","Onayla ve Başlat");contains("Aktif");
        click("a","Ana Sayfa");click("a","Antrenmana git");click("button","Antrenmanı başlat");contains("Çalışıyor");SystemClock.sleep(2300);
        String position="document.querySelector('progress[aria-label=\"Antrenman ilerlemesi\"]').value";double beforeBackground=Double.parseDouble(js(position));
        activity.getScenario().moveToState(Lifecycle.State.CREATED);SystemClock.sleep(1200);activity.getScenario().moveToState(Lifecycle.State.RESUMED);contains("Duraklatıldı");
        double retained=Double.parseDouble(js(position));assertTrue("Real elapsed checkpoint",retained>0&&retained<7000);assertTrue("Background time must not be counted",retained-beforeBackground<1000);SystemClock.sleep(1200);assertEquals(retained,Double.parseDouble(js(position)),0.0);
        activity.getScenario().recreate();contains("AKTİF PROGRAM");click("a","Antrenmana git");contains("Duraklatıldı");assertEquals(retained,Double.parseDouble(js(position)),0.0);
        click("a","Ayarlar");contains("Android uygulaması");click("button","JSON yedeğini indir");
        UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());UiObject2 save=device.wait(Until.findObject(By.text(Pattern.compile("(?i)save|kaydet"))),10000);assertNotNull("Android create-document UI",save);save.click();contains("Yedek dosyası hazırlandı.");
        nativeClick("button","JSON yedeği seç");UiObject2 file=device.wait(Until.findObject(By.textContains("box-antrenman-")),3000);
        if(file==null){UiObject2 roots=device.wait(Until.findObject(By.desc(Pattern.compile("(?i)show roots|show navigation drawer|kökleri göster|gezinme çekmecesini aç"))),3000);if(roots!=null){roots.click();UiObject2 downloads=device.wait(Until.findObject(By.text(Pattern.compile("(?i)downloads|indirilenler"))),3000);if(downloads!=null)downloads.click();}file=device.wait(Until.findObject(By.textContains("box-antrenman-")),10000);}
        if(file==null){ByteArrayOutputStream dump=new ByteArrayOutputStream();device.dumpWindowHierarchy(dump);System.out.println("Native picker hierarchy: "+dump.toString("UTF-8"));}
        assertNotNull("Saved JSON in native document picker",file);file.click();contains("Yedek doğrulandı.");click("button","Doğrulanan yedeği geri yükle");contains("Android uygulaması");
        activity.getScenario().recreate();contains("AKTİF PROGRAM");click("a","Antrenmana git");contains("Duraklatıldı");assertEquals(retained,Double.parseDouble(js(position)),0.0);assertFalse(body().contains("Program bütünlüğü doğrulanamadı"));
        device.pressBack();contains("AKTİF PROGRAM");
    }
}
